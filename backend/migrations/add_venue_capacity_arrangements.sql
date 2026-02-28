-- Tabla: capacidades del salón por tipo de acomodación (auditorio, mesa de trabajo, etc.)
CREATE TABLE IF NOT EXISTS venue_capacity_arrangements (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    layout_type VARCHAR(50),
    layout_schema JSON,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_venue_capacity_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_venue_capacity_arrangements_venue_id ON venue_capacity_arrangements(venue_id);
