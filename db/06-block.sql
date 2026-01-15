CREATE TABLE IF NOT EXISTS block(
    hash VARCHAR(130) NOT NULL PRIMARY KEY,
    blockNumber INT NOT NULL,
    previousHash VARCHAR(130) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transactions INT NOT NULL,
    isValid BOOLEAN NOT NULL DEFAULT TRUE
);

-- NOTE(srvariable): For testing purposes only
INSERT INTO block (hash, blockNumber, previousHash, transactions, isValid) VALUES
('0000000000000000000a7b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w', 1, '0000000000000000000a7b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w', 1, TRUE);
