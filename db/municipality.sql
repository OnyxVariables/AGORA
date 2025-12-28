CREATE TABLE IF NOT EXISTS municipality (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ineId INT NOT NULL,
    provinceId INT NOT NULL,
    name VARCHAR(100),

    UNIQUE(ineId, provinceId),
    CONSTRAINT FK_MUNICIPALITY_provinceId FOREIGN KEY(provinceId) REFERENCES province(ineId)
);
