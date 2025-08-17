-- Insertar categorías de prueba
INSERT INTO categorias (id, nombre, descripcion, activa) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Hardware', 'Problemas relacionados con equipos físicos', true),
('550e8400-e29b-41d4-a716-446655440002', 'Software', 'Problemas con aplicaciones y sistemas', true),
('550e8400-e29b-41d4-a716-446655440003', 'Red', 'Problemas de conectividad y red', true),
('550e8400-e29b-41d4-a716-446655440004', 'Acceso', 'Problemas de permisos y accesos', true),
('550e8400-e29b-41d4-a716-446655440005', 'Otros', 'Otros tipos de incidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar incidencias de prueba usando el primer usuario disponible
INSERT INTO incidencias (id, usuario_id, categoria_id, titulo, descripcion, estado, prioridad, created_at) 
SELECT 
    '660e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM usuarios LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440001',
    'Computadora no enciende',
    'La computadora del escritorio 5 no enciende desde esta mañana. Se verificó que esté conectada correctamente.',
    'abierta',
    'alta',
    NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM incidencias WHERE id = '660e8400-e29b-41d4-a716-446655440001');

INSERT INTO incidencias (id, usuario_id, categoria_id, titulo, descripcion, estado, prioridad, created_at) 
SELECT 
    '660e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM usuarios LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440002',
    'Error en aplicación de nómina',
    'La aplicación de nómina muestra un error al intentar generar el reporte mensual.',
    'en_progreso',
    'media',
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM incidencias WHERE id = '660e8400-e29b-41d4-a716-446655440002');

INSERT INTO incidencias (id, usuario_id, categoria_id, titulo, descripcion, estado, prioridad, created_at) 
SELECT 
    '660e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM usuarios LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440003',
    'Internet lento en oficina',
    'La conexión a internet está muy lenta en toda la oficina desde ayer.',
    'abierta',
    'media',
    NOW() - INTERVAL '6 hours'
WHERE NOT EXISTS (SELECT 1 FROM incidencias WHERE id = '660e8400-e29b-41d4-a716-446655440003');