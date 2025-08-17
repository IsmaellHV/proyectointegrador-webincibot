-- Crear categorías de ejemplo
INSERT INTO categorias (nombre, descripcion) VALUES 
('Hardware', 'Problemas relacionados con equipos físicos'),
('Software', 'Problemas con aplicaciones y sistemas'),
('Red', 'Problemas de conectividad y red'),
('Seguridad', 'Incidentes de seguridad informática'),
('Otros', 'Otros tipos de incidencias');

-- Otorgar permisos a las tablas para los roles anon y authenticated
GRANT SELECT ON categorias TO anon;
GRANT ALL PRIVILEGES ON categorias TO authenticated;
GRANT ALL PRIVILEGES ON usuarios TO authenticated;
GRANT ALL PRIVILEGES ON incidencias TO authenticated;
GRANT ALL PRIVILEGES ON respuestas TO authenticated;