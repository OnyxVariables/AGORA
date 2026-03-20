CREATE TABLE IF NOT EXISTS votation(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    blockchainId INT NOT NULL,
    txHash VARCHAR(130) DEFAULT NULL,
    startBlockHash VARCHAR(130) NOT NULL,
    endBlockHash VARCHAR(130) DEFAULT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    startDate DATETIME NOT NULL DEFAULT CURRENT_DATE,
    endDate DATETIME,
    state ENUM('pending', 'active', 'finished', 'cancelled') NOT NULL,

    CONSTRAINT FK_VOTATION_startBlockHash FOREIGN KEY(startBlockHash) REFERENCES block(hash),
    CONSTRAINT FK_VOTATION_endBlockHash FOREIGN KEY(endBlockHash) REFERENCES block(hash)
);