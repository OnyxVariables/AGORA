CREATE TABLE IF NOT EXISTS votation(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    startBlockHash VARCHAR(130) NOT NULL,
    endBlockHash VARCHAR(130) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    startDate DATETIME NOT NULL DEFAULT CURRENT_DATE,
    endDate DATETIME,
    state ENUM('active', 'finished', 'pending') NOT NULL,

    CONSTRAINT FK_VOTATION_startBlockHash FOREIGN KEY(startBlockHash) REFERENCES block(hash),
    CONSTRAINT FK_VOTATION_endBlockHash FOREIGN KEY(endBlockHash) REFERENCES block(hash)
);

-- NOTE(srvariable): For testing purposes only
INSERT INTO votation (startBlockHash, endBlockHash, title, description, state) VALUES
('0000000000000000000a7b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w', '0000000000000000000a7b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w', 'Elecciones Generales 2024', 'Votación para las elecciones generales de 2024.', 'active');
