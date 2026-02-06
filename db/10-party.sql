CREATE TABLE IF NOT EXISTS party(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
);

-- NOTE(srvariable): For testing purposes only
INSERT INTO party (name) VALUES ('PP'),
('PSOE'),
('Podemos'),
('C’s'),
('VOX'),
('ehbildu'),
('compromís'),
("CC"),
('junts'),
('Más Madrid');
