import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vicaqpcluxkwbbbwdpkg.supabase.co', 'sb_publishable_jpW0W_VeeQXuHJ0XoKJwMg_FNiwdmzE');

async function checkAll() {
  const { data: stats } = await supabase.from('stats_ti').select('*');
  console.log('Total territories:', stats?.length);
  stats?.forEach(s => {
    console.log(s.id_territorio + '. ' + s.territorio + ': semiarido=' + s.qtd_mun_semiarido + ', nao=' + s.qtd_mun_nao_semiarido + ', pct=' + s.pct_semiarido + '%');
  });
}
checkAll();
