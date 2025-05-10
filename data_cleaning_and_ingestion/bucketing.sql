--- wod positon
ALTER TABLE wod_2015 add COLUMN lat_minutes int;
ALTER TABLE wod_2015 add COLUMN lon_minutes int;

UPDATE wod_2015
SET lat_minutes = floor("latitude" * 60 / 15),
    lon_minutes = floor("longitude" * 60 / 15);

INSERT INTO nm_grid_15 (lat_minutes, lon_minutes)
SELECT DISTINCT o.lat_minutes, o.lon_minutes
FROM wod_2015 o
LEFT JOIN nm_grid_15 g
  ON o.lat_minutes = g.lat_minutes AND o.lon_minutes = g.lon_minutes
WHERE g.lat_minutes IS NULL and g.lon_minutes IS NULL;

UPDATE wod_2015 o
SET grid_id = g.id
FROM nm_grid_15 g
WHERE o.lat_minutes = g.lat_minutes AND o.lon_minutes = g.lon_minutes;

ALTER TABLE wod_2015 drop COLUMN lat_minutes;
ALTER TABLE wod_2015 drop COLUMN lon_minutes;

--- obis position
ALTER TABLE obis add COLUMN lat_minutes int;
ALTER TABLE obis add COLUMN lon_minutes int;

UPDATE obis
SET lat_minutes = floor("decimalLatitude" * 60 / 15),
    lon_minutes = floor("decimalLongitude" * 60 / 15);

INSERT INTO nm_grid_15 (lat_minutes, lon_minutes)
SELECT DISTINCT o.lat_minutes, o.lon_minutes
FROM obis o
LEFT JOIN nm_grid_15 g
  ON o.lat_minutes = g.lat_minutes AND o.lon_minutes = g.lon_minutes
WHERE g.lat_minutes IS NULL and g.lon_minutes IS NULL;

UPDATE obis o
SET grid_id = g.id
FROM nm_grid_15 g
WHERE o.lat_minutes = g.lat_minutes AND o.lon_minutes = g.lon_minutes;

ALTER TABLE obis drop COLUMN lat_minutes;
ALTER TABLE obis drop COLUMN lon_minutes;

--- wod depth
UPDATE wod_2015 o
SET depth_id = CASE
    WHEN depth <= 30 THEN 1    -- 0-30m
    WHEN depth <= 100 THEN 2   -- 30-100m
    WHEN depth <= 200 THEN 3   -- 100-200m
    WHEN depth <= 500 THEN 4   -- 200-500m
    WHEN depth <= 1000 THEN 5  -- 500-1000m
    ELSE 6                     -- >1000m
END;

--- obis depth
UPDATE obis o
SET depth_id = CASE
    WHEN depth <= 30 THEN 1    -- 0-30m
    WHEN depth <= 100 THEN 2   -- 30-100m
    WHEN depth <= 200 THEN 3   -- 100-200m
    WHEN depth <= 500 THEN 4   -- 200-500m
    WHEN depth <= 1000 THEN 5  -- 500-1000m
    ELSE 6                     -- >1000m
END;