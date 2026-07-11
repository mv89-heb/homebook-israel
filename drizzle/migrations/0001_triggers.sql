-- Data-integrity triggers that Drizzle's schema DSL can't express directly.
-- Pure Postgres features — work identically on Neon as on any Postgres.

-- Always derive items.home_id from the room, ignoring any client-supplied
-- value, so the denormalized column can never drift from the source of
-- truth (rooms.home_id).
CREATE OR REPLACE FUNCTION sync_item_home_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT r.home_id INTO NEW.home_id
  FROM rooms r
  WHERE r.id = NEW.room_id;

  IF NEW.home_id IS NULL THEN
    RAISE EXCEPTION 'room_id % does not reference an existing room', NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_items_home_id
  BEFORE INSERT OR UPDATE OF room_id ON items
  FOR EACH ROW
  EXECUTE FUNCTION sync_item_home_id();

-- Keep updated_at current on every UPDATE for tables that have it.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_homes_updated_at
  BEFORE UPDATE ON homes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
