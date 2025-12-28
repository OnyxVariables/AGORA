CREATE TABLE IF NOT EXISTS province (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ineId INT NOT NULL,
    autonomousCommunityId INT NOT NULL,
    name VARCHAR(100),

    UNIQUE(ineId, autonomousCommunityId),
    CONSTRAINT FK_PROVINCE_autonomousCommunityId FOREIGN KEY(autonomousCommunityId) REFERENCES autonomousCommunity(ineId)
);
