export interface Member {
  no: number;
  nim: string;
  nama: string;
  prodi: string;
  peran: "Ketua Kelompok" | "Wakil Ketua" | "Anggota";
}

export interface Mentor {
  nama: string;
  prodi: string;
  angkatan: string;
  kontak: string;
  peran?: string;
}

export interface GroupDetails {
  clusterId: string;
  mentors: Mentor[];
  anggota: Member[];
}

export const KELOMPOK_DETAILS: Record<string, GroupDetails> = {
  "01": {
    clusterId: "01",
    mentors: [
      {
        nama: "Kak Mochammad Rizky Saputra",
        prodi: "Sistem Informasi",
        angkatan: "2023",
        kontak: "+62 812-3456-7801",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Anisa Rahmawati",
        prodi: "Manajemen",
        angkatan: "2023",
        kontak: "+62 812-3456-7802",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261001", nama: "Aditia Pratama", prodi: "Sistem Informasi", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261002", nama: "Bima Sakti R.", prodi: "Informatika", peran: "Wakil Ketua" },
      { no: 3, nim: "302261003", nama: "Citra Lestari", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 4, nim: "302261004", nama: "Daffa Ibnu Arfian", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 5, nim: "302261005", nama: "Eka Putri Rahayu", prodi: "Manajemen", peran: "Anggota" },
      { no: 6, nim: "302261006", nama: "Fahri Hamzah N.", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 7, nim: "302261007", nama: "Gita Gutawa P.", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261008", nama: "Hendra Wijaya", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261009", nama: "Indah Permata S.", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261010", nama: "Julian Putra M.", prodi: "Sistem Informasi", peran: "Anggota" },
    ],
  },
  "02": {
    clusterId: "02",
    mentors: [
      {
        nama: "Kak Dewa Made Krishna",
        prodi: "Teknik Industri",
        angkatan: "2023",
        kontak: "+62 812-3456-7803",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Farah Nabila",
        prodi: "Desain Komunikasi Visual",
        angkatan: "2023",
        kontak: "+62 812-3456-7804",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261011", nama: "Kevin Sanjaya B.", prodi: "Manajemen", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261012", nama: "Laila Nur K.", prodi: "Akuntansi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261013", nama: "Muhammad Alfian", prodi: "Informatika", peran: "Anggota" },
      { no: 4, nim: "302261014", nama: "Nadia Safira", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 5, nim: "302261015", nama: "Oscar Ferdy", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261016", nama: "Putri Anggraini", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 7, nim: "302261017", nama: "Qoriatul Aini", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261018", nama: "Rian Hidayat", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 9, nim: "302261019", nama: "Siti Nurhaliza", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261020", nama: "Taufik Hidayat", prodi: "Manajemen", peran: "Anggota" },
    ],
  },
  "03": {
    clusterId: "03",
    mentors: [
      {
        nama: "Kak Gilang Perdana",
        prodi: "Teknik Logistik",
        angkatan: "2023",
        kontak: "+62 812-3456-7805",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Hidayat Nur Wahid",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7806",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261021", nama: "Utami Dewi", prodi: "Teknik Industri", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261022", nama: "Vino G. Bastian", prodi: "Desain Komunikasi Visual", peran: "Wakil Ketua" },
      { no: 3, nim: "302261023", nama: "Wahyu Hidayat", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 4, nim: "302261024", nama: "Xaverius Tyo", prodi: "Informatika", peran: "Anggota" },
      { no: 5, nim: "302261025", nama: "Yuliana Sari", prodi: "Akuntansi", peran: "Anggota" },
      { no: 6, nim: "302261026", nama: "Zackaria Ahmad", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261027", nama: "Amalia Rosa", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 8, nim: "302261028", nama: "Bagas Kara", prodi: "Manajemen", peran: "Anggota" },
      { no: 9, nim: "302261029", nama: "Clara Shinta", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261030", nama: "Dimas Anggara", prodi: "Informatika", peran: "Anggota" },
    ],
  },
  "04": {
    clusterId: "04",
    mentors: [
      {
        nama: "Kak Intan Permata",
        prodi: "Teknik Kimia",
        angkatan: "2023",
        kontak: "+62 812-3456-7807",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Jaka Tarub",
        prodi: "Akuntansi",
        angkatan: "2023",
        kontak: "+62 812-3456-7808",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261031", nama: "Erlando Putra", prodi: "Desain Komunikasi Visual", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261032", nama: "Fania Mariska", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261033", nama: "Gilang Ramadhan", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 4, nim: "302261034", nama: "Hanny Kurnia", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261035", nama: "Iqbal Ramadhan", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261036", nama: "Jessica Mila", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261037", nama: "Kiki Amalia", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 8, nim: "302261038", nama: "Lukman Hakim", prodi: "Informatika", peran: "Anggota" },
      { no: 9, nim: "302261039", nama: "Maya Septha", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261040", nama: "Novan Satria", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
    ],
  },
  "05": {
    clusterId: "05",
    mentors: [
      {
        nama: "Kak Kartika Putri",
        prodi: "Ekonomi Syariah",
        angkatan: "2023",
        kontak: "+62 812-3456-7809",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Lukman Sardi",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7810",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261041", nama: "Oki Setiana", prodi: "Teknik Logistik", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261042", nama: "Pandu Wijaya", prodi: "Informatika", peran: "Wakil Ketua" },
      { no: 3, nim: "302261043", nama: "Qanita Syifa", prodi: "Manajemen", peran: "Anggota" },
      { no: 4, nim: "302261044", nama: "Rizky Febian", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 5, nim: "302261045", nama: "Sania Sabrina", prodi: "Akuntansi", peran: "Anggota" },
      { no: 6, nim: "302261046", nama: "Tri Harmanto", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 7, nim: "302261047", nama: "Ulfa Dwiyanti", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 8, nim: "302261048", nama: "Victor Agustin", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 9, nim: "302261049", nama: "Widya Astuti", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261050", nama: "Yogic Perdana", prodi: "Teknik Logistik", peran: "Anggota" },
    ],
  },
  "06": {
    clusterId: "06",
    mentors: [
      {
        nama: "Kak Maya Estianty",
        prodi: "Manajemen",
        angkatan: "2023",
        kontak: "+62 812-3456-7811",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Nabila Syakieb",
        prodi: "Desain Komunikasi Visual",
        angkatan: "2023",
        kontak: "+62 812-3456-7812",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261051", nama: "Zidan Attalah", prodi: "Informatika", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261052", nama: "Annisa Bahar", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261053", nama: "Bastian Steel", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 4, nim: "302261054", nama: "Chika Jessica", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261055", nama: "Dion Wiyoko", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 6, nim: "302261056", nama: "El Rumi", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261057", nama: "Fuji Anati", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261058", nama: "Gading Marten", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261059", nama: "Hesti Purwadinata", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261060", nama: "Indra Bekti", prodi: "Informatika", peran: "Anggota" },
    ],
  },
  "07": {
    clusterId: "07",
    mentors: [
      {
        nama: "Kak Olga Syahputra",
        prodi: "Sistem Informasi",
        angkatan: "2023",
        kontak: "+62 812-3456-7813",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Parto Patrio",
        prodi: "Teknik Logistik",
        angkatan: "2023",
        kontak: "+62 812-3456-7814",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261061", nama: "Jefri Nichol", prodi: "Teknik Kimia", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261062", nama: "Keisya Levronka", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261063", nama: "Livanti Rose", prodi: "Informatika", peran: "Anggota" },
      { no: 4, nim: "302261064", nama: "Mikha Tambayong", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261065", nama: "Nicholas Saputra", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 6, nim: "302261066", nama: "Olla Ramlan", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261067", nama: "Prilly Latuconsina", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261068", nama: "Raffi Ahmad", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 9, nim: "302261069", nama: "Syuja Qadri", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261070", nama: "Titi Kamal", prodi: "Teknik Kimia", peran: "Anggota" },
    ],
  },
  "08": {
    clusterId: "08",
    mentors: [
      {
        nama: "Kak Suti Karno",
        prodi: "Teknik Industri",
        angkatan: "2023",
        kontak: "+62 812-3456-7815",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Zainal Abidin",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7816",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261071", nama: "Uus Kartika", prodi: "Akuntansi", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261072", nama: "Vanesha Prescilla", prodi: "Desain Komunikasi Visual", peran: "Wakil Ketua" },
      { no: 3, nim: "302261073", nama: "Wika Salim", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 4, nim: "302261074", nama: "Yura Yunita", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261075", nama: "Zaskia Gotik", prodi: "Informatika", peran: "Anggota" },
      { no: 6, nim: "302261076", nama: "Arya Saloka", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261077", nama: "Bunga Citra L.", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261078", nama: "Cinta Laura", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261079", nama: "Dedi Corbuzier", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261080", nama: "Ernest Prakasa", prodi: "Akuntansi", peran: "Anggota" },
    ],
  },
  "09": {
    clusterId: "09",
    mentors: [
      {
        nama: "Kak Achmad Baihaqi",
        prodi: "Sistem Informasi",
        angkatan: "2023",
        kontak: "+62 812-3456-7817",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Bella Safira",
        prodi: "Manajemen",
        angkatan: "2023",
        kontak: "+62 812-3456-7818",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261081", nama: "Fiersa Besari", prodi: "Ekonomi Syariah", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261082", nama: "Gisella Anastasia", prodi: "Manajemen", peran: "Wakil Ketua" },
      { no: 3, nim: "302261083", nama: "Hamish Daud", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 4, nim: "302261084", nama: "Isyana Sarasvati", prodi: "Informatika", peran: "Anggota" },
      { no: 5, nim: "302261085", nama: "Judika Sihotang", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 6, nim: "302261086", nama: "Katon Bagaskara", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261087", nama: "Laudya Cynthia B.", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261088", nama: "Marcell Siahaan", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 9, nim: "302261089", nama: "Najwa Shihab", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 10, nim: "302261090", nama: "Onadio Leonardo", prodi: "Ekonomi Syariah", peran: "Anggota" },
    ],
  },
  "10": {
    clusterId: "10",
    mentors: [
      {
        nama: "Kak Cakra Khan",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7819",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Dian Sastrowardoyo",
        prodi: "Teknik Kimia",
        angkatan: "2023",
        kontak: "+62 812-3456-7820",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261091", nama: "Pevita Pearce", prodi: "Informatika", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261092", nama: "Raditya Dika", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261093", nama: "Raisa Andriana", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 4, nim: "302261094", nama: "Sule Sutisna", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261095", nama: "Titi DJ", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 6, nim: "302261096", nama: "Uky Kautsar", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261097", nama: "Vino Bastian", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261098", nama: "Wulan Guritno", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261099", nama: "Yovie Widianto", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261100", nama: "Zaskia Adya Mecca", prodi: "Informatika", peran: "Anggota" },
    ],
  },
  "11": {
    clusterId: "11",
    mentors: [
      {
        nama: "Kak Erwin Gutawa",
        prodi: "Teknik Logistik",
        angkatan: "2023",
        kontak: "+62 812-3456-7821",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Febby Rastanty",
        prodi: "Akuntansi",
        angkatan: "2023",
        kontak: "+62 812-3456-7822",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261101", nama: "Ariel Noah", prodi: "Manajemen", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261102", nama: "Baim Wong", prodi: "Informatika", peran: "Wakil Ketua" },
      { no: 3, nim: "302261103", nama: "Cella Kotak", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 4, nim: "302261104", nama: "Denny Cagur", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 5, nim: "302261105", nama: "Elvy Sukaesih", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261106", nama: "Fitri Carlina", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261107", nama: "Gito Rollies", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261108", nama: "Iis Dahlia", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261109", nama: "Jamrud Perkasa", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261110", nama: "Kristina", prodi: "Manajemen", peran: "Anggota" },
    ],
  },
  "12": {
    clusterId: "12",
    mentors: [
      {
        nama: "Kak Glenn Fredly",
        prodi: "Desain Komunikasi Visual",
        angkatan: "2023",
        kontak: "+62 812-3456-7823",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Helmi Yahya",
        prodi: "Sistem Informasi",
        angkatan: "2023",
        kontak: "+62 812-3456-7824",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261111", nama: "Lesti Kejora", prodi: "Desain Komunikasi Visual", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261112", nama: "Mulan Jameela", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261113", nama: "Nazar Sungkar", prodi: "Informatika", peran: "Anggota" },
      { no: 4, nim: "302261114", nama: "Opick Tombo", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261115", nama: "Pasha Ungu", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261116", nama: "Rhoma Irama", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261117", nama: "Soimah Pancawati", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261118", nama: "Tantri Kotak", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261119", nama: "Uut Permatasari", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261120", nama: "Via Vallen", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
    ],
  },
  "13": {
    clusterId: "13",
    mentors: [
      {
        nama: "Kak Inul Daratista",
        prodi: "Manajemen",
        angkatan: "2023",
        kontak: "+62 812-3456-7825",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Judika Sihotang",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7826",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261121", nama: "Wendi Cagur", prodi: "Sistem Informasi", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261122", nama: "Yadi Sembako", prodi: "Informatika", peran: "Wakil Ketua" },
      { no: 3, nim: "302261123", nama: "Zian Zigaz", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 4, nim: "302261124", nama: "Andika Pratama", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261125", nama: "Boy William", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261126", nama: "Caren Delano", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261127", nama: "Daniel Mananta", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261128", nama: "Edric Tjandra", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261129", nama: "Fitri Tropica", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261130", nama: "Gilang Dirga", prodi: "Sistem Informasi", peran: "Anggota" },
    ],
  },
  "14": {
    clusterId: "14",
    mentors: [
      {
        nama: "Kak Krisdayanti",
        prodi: "Akuntansi",
        angkatan: "2023",
        kontak: "+62 812-3456-7827",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Lukman Hakim",
        prodi: "Teknik Industri",
        angkatan: "2023",
        kontak: "+62 812-3456-7828",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261131", nama: "Irfan Hakim", prodi: "Teknik Logistik", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261132", nama: "Jemi Koko", prodi: "Informatika", peran: "Wakil Ketua" },
      { no: 3, nim: "302261133", nama: "Kaesang Pangarep", prodi: "Manajemen", peran: "Anggota" },
      { no: 4, nim: "302261134", nama: "Lita Gading", prodi: "Sistem Informasi", peran: "Anggota" },
      { no: 5, nim: "302261135", nama: "Melaney Ricardo", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 6, nim: "302261136", nama: "Nirina Zubir", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261137", nama: "Omesh Ananda", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261138", nama: "Papham", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261139", nama: "Raffi Ahmad", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261140", nama: "Ruben Onsu", prodi: "Teknik Logistik", peran: "Anggota" },
    ],
  },
  "15": {
    clusterId: "15",
    mentors: [
      {
        nama: "Kak Melly Goeslaw",
        prodi: "Teknik Logistik",
        angkatan: "2023",
        kontak: "+62 812-3456-7829",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Niki Zefanya",
        prodi: "Ekonomi Syariah",
        angkatan: "2023",
        kontak: "+62 812-3456-7830",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261141", nama: "Tarra Budiman", prodi: "Teknik Industri", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261142", nama: "Uya Kuya", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261143", nama: "Vicky Prasetyo", prodi: "Informatika", peran: "Anggota" },
      { no: 4, nim: "302261144", nama: "Wika Salim", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 5, nim: "302261145", nama: "Yansen Indiani", prodi: "Manajemen", peran: "Anggota" },
      { no: 6, nim: "302261146", nama: "Zaskia Sungkar", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 7, nim: "302261147", nama: "Aldi Taher", prodi: "Akuntansi", peran: "Anggota" },
      { no: 8, nim: "302261148", nama: "Billy Syahputra", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261149", nama: "Chand Kelvin", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261150", nama: "Daus Separo", prodi: "Teknik Industri", peran: "Anggota" },
    ],
  },
  "16": {
    clusterId: "16",
    mentors: [
      {
        nama: "Kak Once Mekel",
        prodi: "Informatika",
        angkatan: "2023",
        kontak: "+62 812-3456-7831",
        peran: "Mentor 1",
      },
      {
        nama: "Kak Piyu Padi",
        prodi: "Sistem Informasi",
        angkatan: "2023",
        kontak: "+62 812-3456-7832",
        peran: "Mentor 2",
      },
    ],
    anggota: [
      { no: 1, nim: "302261151", nama: "Eko Patrio", prodi: "Informatika", peran: "Ketua Kelompok" },
      { no: 2, nim: "302261152", nama: "Ferdy Element", prodi: "Sistem Informasi", peran: "Wakil Ketua" },
      { no: 3, nim: "302261153", nama: "Ginanjar", prodi: "Desain Komunikasi Visual", peran: "Anggota" },
      { no: 4, nim: "302261154", nama: "Heri Horeh", prodi: "Manajemen", peran: "Anggota" },
      { no: 5, nim: "302261155", nama: "Indra Jegel", prodi: "Teknik Logistik", peran: "Anggota" },
      { no: 6, nim: "302261156", nama: "Jarwo Kwat", prodi: "Akuntansi", peran: "Anggota" },
      { no: 7, nim: "302261157", nama: "Komeng Spontanan", prodi: "Teknik Industri", peran: "Anggota" },
      { no: 8, nim: "302261158", nama: "Lutfi Agizal", prodi: "Teknik Kimia", peran: "Anggota" },
      { no: 9, nim: "302261159", nama: "Mamat Alkatiri", prodi: "Ekonomi Syariah", peran: "Anggota" },
      { no: 10, nim: "302261160", nama: "Ncess Nabati", prodi: "Informatika", peran: "Anggota" },
    ],
  },
};
