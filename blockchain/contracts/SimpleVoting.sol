// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleVoting
 * @dev Contrato para registrar acciones de votación en blockchain
 * @author Onyx2006
 */

contract SimpleVoting {

    // ENUMS
    enum VotationState {
        Active,
        Finished,
        Cancelled
    }

    // STRUCTS
    struct Votation {
        uint256 id;
        string title;
        string description;
        uint256 startDate;
        uint256 endDate;
        VotationState state;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // VARIABLES DE ESTADO
    uint256 private _voteCounter;
    uint256 private _votationCounter;

    address public admin;

    // evitar doble voto
    mapping(bytes32 => bool) private voteHashExists;

    // almacenamiento de votaciones
    mapping(uint256 => Votation) private votations;

    // MODIFICADORES
    modifier onlyAdmin() {
        require(msg.sender == admin, "Solo administrador");
        _;
    }

    // CONSTRUCTOR
    constructor() {
        admin = msg.sender;
    }

    // FUNCIONES DE VOTO
    //Registra el voto en blockchain (solo auditoría)
    function submitVote(
        uint256 _partyId,
        uint256 _votationId,
        uint256 _municipalityId,
        bytes32 _voteHash
    ) external onlyAdmin returns (uint256) {
        require(!voteHashExists[_voteHash], "Voto duplicado");
        require(_votationId < _votationCounter, "Votacion no existe");

        Votation storage votation = votations[_votationId];
        require(votation.state == VotationState.Active, "Votacion no activa");

        require(
            block.timestamp >= votation.startDate,
            "Votacion no iniciada"
        );

        require(
            block.timestamp <= votation.endDate,
            "Votacion finalizada"
        );

        uint256 voteId = _voteCounter++;
        voteHashExists[_voteHash] = true;

        emit VoteSubmitted(
            voteId,
            _votationId,
            _partyId,
            _municipalityId,
            _voteHash,
            block.timestamp
        );

        return voteId;
    }

    // ADMINISTRACION DE VOTACIONES
    // CREATE
    function createVotation(
        uint256 _votationId,
        string memory _title,
        string memory _description,
        uint256 _startDate,
        uint256 _endDate
    ) external onlyAdmin {
        require(_startDate < _endDate, "Fechas invalidas");
        require(votations[_votationId].creator == address(0), "VotationId ya existe");
        
        // Actualizar contador si es necesario
        if (_votationId >= _votationCounter) {
            _votationCounter = _votationId + 1;
        }
        
        Votation storage votation = votations[_votationId];

        votation.id = _votationId;
        votation.title = _title;
        votation.description = _description;
        votation.startDate = _startDate;
        votation.endDate = _endDate;
        votation.state = VotationState.Active;
        votation.creator = msg.sender;
        votation.createdAt = block.timestamp;
        votation.updatedAt = block.timestamp;

        emit VotationCreated(
            _votationId,
            _title,
            _description,
            _startDate,
            _endDate,
            msg.sender,
            block.timestamp
        );
    }

    // UPDATE
    function updateVotation(
        uint256 _votationId,
        string memory _title,
        string memory _description,
        uint256 _startDate,
        uint256 _endDate,
        VotationState _state
    ) external onlyAdmin {
        require(_votationId < _votationCounter, "Votacion no existe");
        require(_startDate < _endDate, "Fechas invalidas");

        Votation storage votation = votations[_votationId];

        votation.title = _title;
        votation.description = _description;
        votation.startDate = _startDate;
        votation.endDate = _endDate;
        votation.state = _state;
        votation.updatedAt = block.timestamp;

        emit VotationUpdated(
            _votationId,
            _title,
            _description,
            _startDate,
            _endDate,
            _state,
            msg.sender,
            block.timestamp
        );
    }

    // DELETE (en blockchain no se puede eliminar, se cancela)
    function cancelVotation(
        uint256 _votationId,
        string memory _reason
    ) external onlyAdmin {

        require(_votationId < _votationCounter, "Votacion no existe");

        Votation storage votation = votations[_votationId];

        require(
            votation.state != VotationState.Finished,
            "Votacion finalizada"
        );

        votation.state = VotationState.Cancelled;
        votation.updatedAt = block.timestamp;

        emit VotationCancelled(
            _votationId,
            _reason,
            msg.sender,
            block.timestamp
        );
    }

    // UPDATE (cambia el estado a Finished)
    function finishVotation(uint256 _votationId) external onlyAdmin {
        require(_votationId < _votationCounter, "Votacion no existe");
        Votation storage votation = votations[_votationId];

        require(
            votation.state == VotationState.Active,
            "No esta activa"
        );

        require(
            block.timestamp >= votation.endDate,
            "Aun no ha terminado"
        );

        votation.state = VotationState.Finished;
        votation.updatedAt = block.timestamp;

        emit VotationFinished(
            _votationId,
            msg.sender,
            block.timestamp
        );
    }

    // TRANSFERENCIA DE ADMINISTRADOR
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Direccion invalida");
        admin = _newAdmin;
    }

    // EVENTOS para Spring Boot
    event VoteSubmitted(
        uint256 indexed voteId,
        uint256 indexed votationId,
        uint256 partyId,
        uint256 municipalityId,
        bytes32 voteHash,
        uint256 timestamp
    );

    event VotationCreated(
        uint256 indexed votationId,
        string title,
        string description,
        uint256 startDate,
        uint256 endDate,
        address indexed creator,
        uint256 timestamp
    );

    event VotationUpdated(
        uint256 indexed votationId,
        string title,
        string description,
        uint256 startDate,
        uint256 endDate,
        VotationState state,
        address indexed updater,
        uint256 timestamp
    );

    event VotationCancelled(
        uint256 indexed votationId,
        string reason,
        address indexed canceller,
        uint256 timestamp
    );

    event VotationFinished(
        uint256 indexed votationId,
        address indexed finisher,
        uint256 timestamp
    );
}