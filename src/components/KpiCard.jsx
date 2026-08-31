import React from 'react';

export const KpiCard = ({ titulo, valor, icone, corDestaque }) => {
 return (
 <div className="card-indicador" style={{ borderLeft: `4px solid ${corDestaque}` }}>
 <div className="card-icone">
 {icone}
 </div>
 <div className="card-conteudo">
 <h4 className="card-titulo">{titulo}</h4>
 <span className="card-valor">{valor}</span>
 </div>
 </div>
 );
};