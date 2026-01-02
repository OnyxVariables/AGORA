CREATE TABLE IF NOT EXISTS seat(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    votationId INT NOT NULL,
    provinceId INT NOT NULL,
    partyId INT NOT NULL,
    seatsAssigned INT NOT NULL,
    votes INT NOT NULL,
    calculationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_SEAT_votationId FOREIGN KEY(votationId) REFERENCES votation(id),
    CONSTRAINT FK_SEAT_provinceId FOREIGN KEY(provinceId) REFERENCES province(id),
    CONSTRAINT FK_SEAT_partyId FOREIGN KEY(partyId) REFERENCES party(id)
);
