import fs from 'fs';

let content = fs.readFileSync('src/components/DashboardPainel.jsx', 'utf8');

const replacement1 = `        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map(cardId => (
                <React.Fragment key={cardId}>
                  {cardId === 'card-donut' && (
                    <SortableCard id="card-donut">`;

content = content.replace(
  '        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">',
  replacement1
);

content = content.replace(
  '          {/* CARD 2: PIE CHART (Distribuição do Ecossistema) */}',
  `                    </SortableCard>
                  )}
                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      {/* CARD 2: PIE CHART (Distribuição do Ecossistema) */}`
);

content = content.replace(
  '          {/* CARD 3: RANKING IFDM */}',
  `                    </SortableCard>
                  )}
                  {cardId === 'card-ranking' && (
                    <SortableCard id="card-ranking">
                      {/* CARD 3: RANKING IFDM */}`
);

content = content.replace(
  '          {/* CARD 4: MAPEAMENTO GERAL (GRÁFICO COMPACTO) */}',
  `                    </SortableCard>
                  )}
                  {cardId === 'card-mapeamento' && (
                    <SortableCard id="card-mapeamento">
                      {/* CARD 4: MAPEAMENTO GERAL (GRÁFICO COMPACTO) */}`
);

const replacementEnd = `            </div>
          </div>
                    </SortableCard>
                  )}
                </React.Fragment>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>`;

content = content.replace(
  `            </div>
          </div>

        </div>

      </div>`,
  replacementEnd
);

fs.writeFileSync('src/components/DashboardPainel.jsx', content);
console.log('Patched DashboardPainel.jsx successfully!');
