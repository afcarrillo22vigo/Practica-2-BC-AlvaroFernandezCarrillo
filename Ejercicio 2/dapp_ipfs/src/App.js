import React, { useEffect, useState } from "react";
import './App.css';
import { create } from 'kubo-rpc-client';
import { ethers } from "ethers";
import { Buffer } from "buffer";
import logo from "./ethereumLogo.png";
import { addresses, abis } from "./contracts";

function App() {
  const [file, setFile] = useState(null);
  
  const [certId, setCertId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [degreeName, setDegreeName] = useState("");
  
  const [verifyId, setVerifyId] = useState("");
  const [certData, setCertData] = useState(null);

  const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
  const certContract = new ethers.Contract(addresses.ipfs, abis.ipfs, defaultProvider);

  useEffect(() => {
    window.ethereum.enable();
  }, []);

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(Buffer(reader.result));
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      const client = await create('/ip4/127.0.0.1/tcp/5001');
      const result = await client.add(file);
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);
      console.log("CID IPFS:", result.cid.toString());

      const signer = defaultProvider.getSigner();
      const contractWithSigner = certContract.connect(signer);
      
      console.log("Llamando a issueCertificate en Ethereum...");
      const tx = await contractWithSigner.issueCertificate(
        certId, 
        studentName, 
        degreeName, 
        result.cid.toString()
      );
      await tx.wait();
      
      alert("¡Certificado emitido con éxito!");
    } catch (error) {
      console.error(error);
      alert("Error: Revisa la consola (¿Eres la universidad?)");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await certContract.verifyCertificate(verifyId);
      setCertData({
        name: data[0],
        degree: data[1],
        cid: data[2],
        date: new Date(data[3].toNumber() * 1000).toLocaleString(),
        isValid: data[4]
      });
    } catch (error) {
      console.error(error);
      alert("Certificado no encontrado.");
      setCertData(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" style={{height: '80px'}} />
        <h2>Portal de Títulos Universitarios (IPFS)</h2>

        <div style={{display: 'flex', gap: '50px'}}>
          <div style={{border: '1px solid white', padding: '20px', borderRadius: '10px'}}>
            <h3>Emitir Certificado (Solo Universidad)</h3>
            <form onSubmit={handleIssue} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <input type="text" placeholder="ID Certificado (ej. DNI)" onChange={e => setCertId(e.target.value)} required />
              <input type="text" placeholder="Nombre Alumno" onChange={e => setStudentName(e.target.value)} required />
              <input type="text" placeholder="Titulación" onChange={e => setDegreeName(e.target.value)} required />
              <input type="file" onChange={retrieveFile} required />
              <button type="submit">Emitir y Guardar</button>
            </form>
          </div>

          <div style={{border: '1px solid white', padding: '20px', borderRadius: '10px'}}>
            <h3>Verificador Público</h3>
            <form onSubmit={handleVerify} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <input type="text" placeholder="ID Certificado a verificar" onChange={e => setVerifyId(e.target.value)} required />
              <button type="submit">Verificar</button>
            </form>

            {certData && (
              <div style={{marginTop: '20px', textAlign: 'left', fontSize: '16px', background: '#282c34', padding: '10px'}}>
                <p><strong>Estado:</strong> {certData.isValid ? "--- VÁLIDO ---" : "--- REVOCADO ---"}</p>
                <p><strong>Alumno:</strong> {certData.name}</p>
                <p><strong>Título:</strong> {certData.degree}</p>
                <p><strong>Fecha:</strong> {certData.date}</p>
                <p><strong>Ver Documento original (IPFS):</strong></p>
                <a href={`http://127.0.0.1:8081/ipfs/${certData.cid}`} target="_blank" rel="noreferrer" style={{color: 'cyan'}}>
                  Abrir Documento
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;