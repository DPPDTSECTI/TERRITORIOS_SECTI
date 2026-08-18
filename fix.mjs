import fs from 'fs';

let content = fs.readFileSync('src/components/DashboardPainel.jsx', 'utf8');
const lines = content.split('\n');
const goodLines = lines.slice(0, 533);
const tail = `                  </div>
                  <span className="text-[9px] font-extrabold text-[#457B9D] w-[20px]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
                    </SortableCard>
                  )}
                </React.Fragment>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </main>
  );
}
`;
fs.writeFileSync('src/components/DashboardPainel.jsx', goodLines.join('\n') + '\n' + tail);
console.log('Fixed end of DashboardPainel.jsx');
