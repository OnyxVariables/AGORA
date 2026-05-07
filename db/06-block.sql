CREATE TABLE IF NOT EXISTS block(
    hash VARCHAR(130) NOT NULL PRIMARY KEY,
    blockNumber INT NOT NULL,
    previousHash VARCHAR(130) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transactions INT NOT NULL,
    isValid BOOLEAN NOT NULL DEFAULT TRUE,
    chain_timestamp INT UNSIGNED DEFAULT NULL COMMENT 'Unix segundos del bloque en cadena (para series temporales)',

    UNIQUE(blockNumber, isValid)
);