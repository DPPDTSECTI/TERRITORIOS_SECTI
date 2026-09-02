import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vicaqpcluxkwbbbwdpkg.supabase.co', 'sb_publishable_jpW0W_VeeQXuHJ0XoKJwMg_FNiwdmzE');

async function checkTables() {
  const tables = ['municipios', 'semiarido', 'municipio_semiarido', 'semiarido_municipios', 'lista_municipios', 'municipios_semiarido'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (!error) {
      console.log('Found table:', t, data);
    }
  }
}
checkTables();
