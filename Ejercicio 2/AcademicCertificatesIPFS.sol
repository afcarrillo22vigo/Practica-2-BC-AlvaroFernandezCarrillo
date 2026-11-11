// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract AcademicCertificatesIPFS {
    address public immutable universityOwner;

    struct Certificate {
        string studentName;
        string degreeName;
        string ipfsCID; // NUEVO: Hash de IPFS que apunta al PDF del título
        uint64 issueDate;
        bool isValid;
    }

    // Mapeo: Hash identificador (ej. DNI o UUID) => Datos del Certificado
    mapping(string => Certificate) public certificates;

    event CertificateIssued(string indexed certId, string studentName, string ipfsCID);
    event CertificateRevoked(string indexed certId);

    modifier onlyUniversity() {
        require(msg.sender == universityOwner, "Acceso denegado: Solo la universidad");
        _;
    }

    constructor() {
        universityOwner = msg.sender;
    }

    // Emitir certificado subiendo el hash de IPFS
    function issueCertificate(
        string calldata _certId,
        string calldata _studentName,
        string calldata _degreeName,
        string calldata _ipfsCID
    ) external onlyUniversity {
        require(certificates[_certId].issueDate == 0, "El certificado ya existe");

        certificates[_certId] = Certificate({
            studentName: _studentName,
            degreeName: _degreeName,
            ipfsCID: _ipfsCID,
            issueDate: uint64(block.timestamp),
            isValid: true
        });

        emit CertificateIssued(_certId, _studentName, _ipfsCID);
    }

    // Revocar en caso de error
    function revokeCertificate(string calldata _certId) external onlyUniversity {
        require(certificates[_certId].issueDate != 0, "El certificado no existe");
        require(certificates[_certId].isValid, "El certificado ya estaba revocado");

        certificates[_certId].isValid = false;
        emit CertificateRevoked(_certId);
    }

    // Consultar certificado
    function verifyCertificate(string calldata _certId)
        external
        view
        returns (
            string memory studentName,
            string memory degreeName,
            string memory ipfsCID,
            uint64 issueDate,
            bool isValid
        )
    {
        Certificate memory cert = certificates[_certId];
        require(cert.issueDate != 0, "Certificado no encontrado");
        return (cert.studentName, cert.degreeName, cert.ipfsCID, cert.issueDate, cert.isValid);
    }
}