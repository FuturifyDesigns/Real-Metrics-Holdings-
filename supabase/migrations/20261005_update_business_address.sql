update public.site_settings
set
  address = '10102 Mafulo House, next to Old Prison Headquarters, Taung Broadhurst, Gaborone, Botswana, Office 6',
  updated_at = now()
where singleton_key = 'main';
