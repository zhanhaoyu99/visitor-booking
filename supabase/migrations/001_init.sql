-- 预约项目
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 时段模板（按星期）
CREATE TABLE time_slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0)
);

-- 特殊日期（整天关闭）
CREATE TABLE special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  UNIQUE (service_id, date)
);

-- 日期级时段覆盖（完全替代该天的模板时段）
CREATE TABLE date_slot_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0)
);

-- 预约记录
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 防重复预约：同一人同一天同一服务只能有一个有效预约
CREATE UNIQUE INDEX idx_bookings_unique_active
  ON bookings (phone, booking_date, service_id)
  WHERE status = 'confirmed';

-- 查询索引
CREATE INDEX idx_bookings_date ON bookings (booking_date, service_id, status);
CREATE INDEX idx_bookings_code ON bookings (booking_code);

-- 防并发超卖的预约 RPC
CREATE OR REPLACE FUNCTION create_booking(
  p_service_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_name TEXT,
  p_phone TEXT,
  p_id_number TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS TABLE(booking_id UUID, booking_code TEXT) AS $$
DECLARE
  v_capacity INT;
  v_booked INT;
  v_booking_id UUID;
  v_booking_code TEXT;
  v_lock_key BIGINT;
BEGIN
  -- 生成锁 key：基于 service_id 和日期+时段
  v_lock_key := abs(hashtext(p_service_id::text || p_booking_date::text || p_start_time::text));

  -- 获取事务级别的 advisory lock
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 获取容量：优先查 date_slot_overrides，无记录再 fallback 到 time_slot_templates
  SELECT dso.capacity INTO v_capacity
  FROM date_slot_overrides dso
  WHERE dso.service_id = p_service_id
    AND dso.date = p_booking_date
    AND dso.start_time = p_start_time
    AND dso.end_time = p_end_time;

  IF v_capacity IS NULL THEN
    SELECT tst.capacity INTO v_capacity
    FROM time_slot_templates tst
    WHERE tst.service_id = p_service_id
      AND tst.day_of_week = EXTRACT(DOW FROM p_booking_date)
      AND tst.start_time = p_start_time
      AND tst.end_time = p_end_time;
  END IF;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND: 时段不存在';
  END IF;

  -- 检查该日期是否关闭
  IF EXISTS (
    SELECT 1 FROM special_dates sd
    WHERE sd.service_id = p_service_id
      AND sd.date = p_booking_date
      AND sd.is_closed = true
  ) THEN
    RAISE EXCEPTION 'DATE_CLOSED: 该日期不可预约';
  END IF;

  -- 统计已预约数量
  SELECT COUNT(*) INTO v_booked
  FROM bookings b
  WHERE b.service_id = p_service_id
    AND b.booking_date = p_booking_date
    AND b.start_time = p_start_time
    AND b.end_time = p_end_time
    AND b.status = 'confirmed';

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'SLOT_FULL: 该时段已满';
  END IF;

  -- 生成预约编号：日期 + 随机4位
  v_booking_code := to_char(p_booking_date, 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');

  -- 插入预约
  INSERT INTO bookings (booking_code, service_id, booking_date, start_time, end_time, name, phone, id_number, note)
  VALUES (v_booking_code, p_service_id, p_booking_date, p_start_time, p_end_time, p_name, p_phone, p_id_number, p_note)
  RETURNING bookings.id INTO v_booking_id;

  RETURN QUERY SELECT v_booking_id, v_booking_code;
END;
$$ LANGUAGE plpgsql;
