CREATE TABLE IF NOT EXISTS province (
    id INT NOT NULL,
    autonomousCommunityId INT NOT NULL,
    name VARCHAR(100),

    PRIMARY KEY(id, autonomousCommunityId),
    CONSTRAINT FK_PROVINCE_autonomousCommunityId FOREIGN KEY(autonomousCommunityId) REFERENCES autonomousCommunity(id)
);
