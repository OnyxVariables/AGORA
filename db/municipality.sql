CREATE TABLE IF NOT EXISTS municipality (
    id INT NOT NULL,
    provinceId INT NOT NULL,
    name VARCHAR(100),

    PRIMARY KEY(id, provinceId),
    CONSTRAINT FK_MUNICIPALITY_provinceId FOREIGN KEY(provinceId) REFERENCES province(id)
);
