'use client';

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import styles from "./AnggotaDivisi.module.css";
import { getCloudinaryUrl } from "@/utils/cloudinary";
import {
  Users,
  Shield,
  Camera,
  Truck,
  HeartPulse,
  UserCheck,
  Coffee,
  Search,
  Sparkles,
  User,
  GraduationCap,
  Megaphone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  prodi: string;
  role: string;
  divisionId: string;
  divisionName: string;
  image?: string;
}

interface Division {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  description: string;
  koordinator: string;
}

const DIVISIONS: Division[] = [
  {
    id: "bph",
    name: "Badan Pengurus Harian (BPH)",
    shortName: "BPH",
    icon: <Shield size={16} />,
    description: "Penanggung jawab utama, pengarah kebijakan, dan pengelola administrasi & keuangan AETHERA SILO UISI 2026.",
    koordinator: "Nabil Qudsi Mas’ud (Ketua Pelaksana)"
  },
  {
    id: "acara",
    name: "Divisi Steering Committee & Acara",
    shortName: "SC & Acara",
    icon: <Sparkles size={16} />,
    description: "Merancang konsep, alur rundown acara, tata panggung, dan eksekusi seluruh kegiatan AETHERA SILO UISI 2026.",
    koordinator: "Jefranda Dinata (Koordinator SC & Acara)"
  },
  {
    id: "pdd",
    name: "Divisi Publikasi, Dekorasi & Dokumentasi (PDD)",
    shortName: "PDD",
    icon: <Camera size={16} />,
    description: "Mengelola desain visual, videografi, fotografi, materi publikasi, dan estetika dekorasi.",
    koordinator: "Alfian Khusnul Fatoni"
  },
  {
    id: "logtrans",
    name: "Divisi Logistik, Transportasi & Konsumsi (Logtrans & Konsumsi)",
    shortName: "Logtrans & Konsumsi",
    icon: <Truck size={16} />,
    description: "Menyiapkan perlengkapan teknis, prasarana kegiatan, transportasi, serta pengolahan kebutuhan konsumsi panitia dan peserta.",
    koordinator: "Muhammad Faidza Airlangga"
  },
  {
    id: "medis",
    name: "Divisi Medis & K3",
    shortName: "Medis",
    icon: <HeartPulse size={16} />,
    description: "Pertolongan pertama, kesiapsiagaan posko kesehatan, dan keselamatan seluruh peserta dan panitia.",
    koordinator: "Callysta Goesti Annayla Sumarlin (Kepala Divisi Medis)"
  },
  {
    id: "mentor",
    name: "Divisi Mentor Kelompok",
    shortName: "Mentor Kelompok",
    icon: <UserCheck size={16} />,
    description: "Pendamping dan pembimbing utama setiap rasi kelompok mahasiswa baru Satya Ismaya 14.",
    koordinator: "Muhammad Ivandy Rohman (Koordinator Mentor)"
  },
  {
    id: "humas",
    name: "Divisi Humas & Sponsorship",
    shortName: "Humas & Sponsorship",
    icon: <Megaphone size={16} />,
    description: "Mengelola komunikasi publik, jaringan eksternal, publikasi media partner, dan kemitraan sponsorship AETHERA SILO UISI 2026.",
    koordinator: "Tim Humas & Sponsorship"
  }
];

const MEMBERS: Member[] = [
  // BPH
  { id: "1", name: "Nabil Qudsi Mas’ud", prodi: "Ekonomi Syariah", role: "Ketua Pelaksana", divisionId: "bph", divisionName: "BPH", image: "/nabil_qudsi.webp" },
  { id: "2", name: "M. Rosyid Ridlo", prodi: "Teknik Logistik", role: "Sekretaris 1", divisionId: "bph", divisionName: "BPH", image: "/rosyid_ridlo.webp" },
  { id: "3", name: "Hillyatut Taqiya", prodi: "Ekonomi Syariah", role: "Sekretaris 2", divisionId: "bph", divisionName: "BPH", image: "/hillyatut_taqiya.webp" },
  { id: "4", name: "Zahra Naila Supriyono Putri", prodi: "Akuntansi", role: "Bendahara 1", divisionId: "bph", divisionName: "BPH", image: "/zahra_naila.webp" },
  { id: "5", name: "Putri Fara Diba", prodi: "Ekonomi Syariah", role: "Bendahara 2", divisionId: "bph", divisionName: "BPH", image: "/putri_fara.webp" },

  // SC & Acara
  { id: "6", name: "Jefranda Dinata", prodi: "Ekonomi Syariah", role: "Koordinator SC & Acara", divisionId: "acara", divisionName: "SC & Acara", image: "/jefranda_dinata.webp" },
  { id: "7", name: "Khairun Niza", prodi: "Manajemen", role: "Wakil Koordinator SC & Acara", divisionId: "acara", divisionName: "SC & Acara", image: "/khairun_niza.webp" },
  { id: "8", name: "Melly Mutiara", prodi: "Manajemen", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Melly Mutiara.JPG" },
  { id: "9", name: "Muhaemit", prodi: "Manajemen", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Muhaemit.jpg" },
  { id: "10", name: "Novi Risma Ameliasari", prodi: "Teknik Kimia", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Novi Risma Amelia Sari.jpg" },
  { id: "11", name: "Regitha Eka Purwananditha Candraningtyas", prodi: "Sistem Informasi", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Regitha Eka Purwananditha Candraningtyas.jpg" },
  { id: "12", name: "Sneha Naafi' Amrulloh", prodi: "Teknik Logistik", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Sneha Naafi' Amrulloh.jpg" },
  { id: "13", name: "Valentino Zaky", prodi: "Manajemen", role: "Anggota SC", divisionId: "acara", divisionName: "SC & Acara", image: "/fotoAnggota/SC&Acara/IMG_0124.jpg" },
  { id: "14", name: "Chelsea Aurelia Manihuruk", prodi: "Akuntansi", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Chelsea Aurelia Manihuruk.JPG" },
  { id: "15", name: "Nisa Dzakiatul Fikriyah", prodi: "Akuntansi", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Nisa Dzakiyatul Fikriyah.JPG" },
  { id: "16", name: "Rendy Alfiansyah", prodi: "Informatika", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Rendy Alfiansyah.JPG" },
  { id: "17", name: "Jevamya Chelcie Wicaksana", prodi: "Teknik Kimia", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Jevamya Chelcie Wicaksana.JPG" },
  { id: "18", name: "Muhammad Hanif Raja I", prodi: "Manajemen", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Muhammad Hanif Raja i.JPG" },
  { id: "19", name: "Dhea Safira Rahmawati", prodi: "Teknologi Industri Pertanian", role: "Anggota Acara", divisionId: "acara", divisionName: "SC & Acara" , image: "/fotoAnggota/SC&Acara/Dhea Safira Rahmawati.jpg" },

  // PDD
  { id: "30", name: "Alfian Khusnul Fatoni", prodi: "Informatika", role: "Koordinator PDD", divisionId: "pdd", divisionName: "PDD", image: "/alfian_fatoni.webp" },
  { id: "31", name: "Salwa Mufidah Hayati", prodi: "Eksyar", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Salwa Mufidah Hayati.JPG" },
  { id: "32", name: "Wanda Adelya Pratiwi", prodi: "Akuntansi", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Wanda Adelya Pratiwi.JPG" },
  { id: "33", name: "Mohammad Fathir Ubaidillah Al Azubi", prodi: "Manajemen", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Mohammad Fathir Ubaidillah Al Azubi.JPG" },
  { id: "34", name: "Athallah Yahya Armadhanu", prodi: "DKV", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Athallah Yahya Armadhanu.JPG" },
  { id: "35", name: "Encik Thuffayl Izzatul Syamsi", prodi: "DKV", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Encik Thuffayl Izzatul Syamsi.JPG" },
  { id: "36", name: "Muhammad Hadi Masbukhin Assafi'i", prodi: "DKV", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Muhammad Hadi Masbukhin.JPG" },
  { id: "37", name: "Lelly Michela Aprilindo", prodi: "DKV", role: "Anggota PDD", divisionId: "pdd", divisionName: "PDD" , image: "/fotoAnggota/PDD/Lelly Michela Aprilindo.JPG" },

  // Logtrans
  { id: "38", name: "Muhammad Faidza Airlangga", prodi: "Informatika", role: "Koordinator Logtrans", divisionId: "logtrans", divisionName: "Logtrans", image: "/faidza_airlangga.webp" },
  { id: "39", name: "Agil Boy Ahmada", prodi: "DKV", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Agil Boy Ahmada.jpg" },
  { id: "40", name: "Galan Gantari", prodi: "Ekonomi Syariah", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Galan Gantari.jpg" },
  { id: "41", name: "M. Abdillah Malik", prodi: "Ekonomi Syariah", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/M Abdillah Malik.jpg" },
  { id: "42", name: "Muhammad Rizqi Fadhilah", prodi: "Informatika", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Muhammad Rizqi Fadillah.jpg" },
  { id: "43", name: "Rais Attalla Prakasa", prodi: "Teknik Logistik", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Rais Attalla Prakasa.jpg" },
  { id: "44", name: "Panji Nashrulloh", prodi: "DKV", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Panji Nasrullah.jpg" },
  { id: "45", name: "Byandra Galang Atmodjo", prodi: "Manajemen", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Byandra Galang Atmod.jpg" },
  { id: "46", name: "Bagus Setyo Nugroho", prodi: "Informatika", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Bagus Setyo Nugroho.jpg" },
  { id: "47", name: "M Awaludin Ikbar", prodi: "Informatika", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/M Awalludin Ikbar.jpg" },
  { id: "48", name: "Dimas Putra Ardiansyah", prodi: "Manajemen Rekayasa", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Dimas Putra Ardiansyah.jpg" },
  { id: "49", name: "Muhammad Daniel Arya putra", prodi: "Informatika", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Muhammad Daniel Arya.jpg" },
  { id: "50", name: "Ravil Rizkia Nurdiansyah", prodi: "Manajemen Rekayasa", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Ravil Rizkia Nurdiansyah.jpg" },
  { id: "51", name: "Aqil Ilham Anandra", prodi: "Teknik Kimia", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Aqil Ilham Anandra.jpg" },
  { id: "52", name: "Didin Khoiruddin Amin", prodi: "Teknik Logistik", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Didin Khoiruddin Amin.jpg" },
  { id: "53", name: "Gading Najha Rahadiananto", prodi: "Teknik Logistik", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Gading Najha Rahadiana.jpg" },
  { id: "54", name: "Erlangga Harsyawardhana Aria Purwadi", prodi: "Teknik Logistik", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans", image: "/fotoAnggota/Logtrans/Erlangga Harsyawardhana.jpg" },
  { id: "55", name: "Rio Al Kaseno", prodi: "Informatika", role: "Anggota Logtrans", divisionId: "logtrans", divisionName: "Logtrans" , image: "/fotoAnggota/Logtrans/Rio Al Kaseno.jpg" },

  // Medis
  { id: "56", name: "Callysta Goesti Annayla Sumarlin", prodi: "Akuntansi", role: "Kepala Divisi Medis", divisionId: "medis", divisionName: "Medis", image: "/callysta_goesti.webp" },
  { id: "57", name: "Faza Sazkiyah", prodi: "Akuntansi", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Faza Sazkiyah.jpg" },
  { id: "58", name: "Reynata Hartani", prodi: "Teknik Kimia", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Reynata Hartani.jpg" },
  { id: "59", name: "Raditya Fahrezi Putra Ahsan", prodi: "Informatika", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Raditya Fahrezi Putra A.jpg" },
  { id: "60", name: "Mochamad Rifki Al Farizi", prodi: "Informatika", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Mochamad Rifki Al Farizi.jpg" },
  { id: "61", name: "Jafar Sodiq", prodi: "Informatika", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Jafar Sodiq.jpg" },
  { id: "62", name: "Ananda Khusnul Selfiana", prodi: "Manajemen Rekayasa", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Ananda Khusnul Selfiana.jpg" },
  { id: "63", name: "Pradita Syifa Azizah", prodi: "Akuntansi", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Pradita Syifa Azizah.jpg" },
  { id: "64", name: "Siti Nur Solika Anwar", prodi: "Akuntansi", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Siti Nur Solika Anwar.jpg" },
  { id: "65", name: "Muhammad Fahri Hidayat", prodi: "Teknik Logistik", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Muhammad Fahri Hidayat.jpg" },
  { id: "66", name: "Abid Naufal Arifin", prodi: "Teknik Logistik", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Abid Naufal Arifin.jpg" },
  { id: "67", name: "Fauzan Ali Subhan", prodi: "Teknik Logistik", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Fauzan Ali Subhan.jpg" },
  { id: "68", name: "Airlangga Putra Andhika", prodi: "Teknik Kimia", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Airlangga Putra Andhika.png" },
  { id: "69", name: "Maria Fransiska Cicilia", prodi: "Teknik Kimia", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Maria Fransiska Cicilia.jpg" },
  { id: "70", name: "Rio Kristoper Sinaga", prodi: "Teknik Kimia", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Rio Kristoper Sinaga.jpg" },
  { id: "71", name: "Amirul Hakim", prodi: "Teknik Kimia", role: "Anggota Medis", divisionId: "medis", divisionName: "Medis" , image: "/fotoAnggota/Medis/Amirul Hakim.jpg" },

  // Mentor Kelompok
  { id: "72", name: "Muhammad Ivandy Rohman", prodi: "Informatika", role: "Koordinator Mentor kelompok", divisionId: "mentor", divisionName: "Mentor", image: "/ivandy_rohman.webp" },
  { id: "73", name: "Dealova Fransisca Ferlianti", prodi: "Teknik Logistik", role: "Wakil Koordinator Mentor kelompok", divisionId: "mentor", divisionName: "Mentor", image: "/dealova_fransisca.webp" },
  { id: "74", name: "Achmad Ricky Hariono", prodi: "Informatika", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Achmad Ricky Hariono.jpg" },
  { id: "75", name: "Isnanda Saputra", prodi: "Teknologi Industri Pertanian", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Isnanda Saputra.jpg" },
  { id: "76", name: "In’am Faadilah Ramadhani Tavisyach", prodi: "Sistem Informasi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/In’am Faadilah Ramadhani T.jpg" },
  { id: "77", name: "Raafa Nabil Rabbani", prodi: "Informatika", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Raafa Nabil Rabbani.jpg" },
  { id: "78", name: "Rexa Wiritnayaka Afandi", prodi: "Manajemen", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Rexa Wiritnayaka Afandi.jpg" },
  { id: "79", name: "Tegar Aditya Utomo", prodi: "Teknik Kimia", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Tegar Aditya Utomo.jpg" },
  { id: "80", name: "Rhenita Theresia Grace Bancin", prodi: "Informatika", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Rhenita Theresia Grace Bancin.jpg" },
  { id: "81", name: "Aura Raina Rezkika", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Aura Raina Rezkika.jpg" },
  { id: "82", name: "Annisa Dwi Fatmawati", prodi: "Akuntansi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Annisa Dwi Fatmawati.jpg" },
  { id: "83", name: "Alfianti duwi rahmawati", prodi: "Ekonomi Syariah", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Alfianti duwi rahmawati.jpg" },
  { id: "84", name: "Uma Najah Salsabilah", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Uma Najah Salsabilah.jpg" },
  { id: "85", name: "Fadhilatul Qomariyah", prodi: "Ekonomi Syariah", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Fadhilatul Qomariyah.jpg" },
  { id: "86", name: "Wulansari", prodi: "Ekonomi Syariah", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Wulansari.jpg" },
  { id: "87", name: "Putra Rizqullah Rakha Atmajaya", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Putra Rizqullah Rakha Atmajaya.jpg" },
  { id: "88", name: "Adya Riski Dimas Riadi", prodi: "Akuntansi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Adya Riski Dimas Riadi.jpg" },
  { id: "89", name: "Robby Irham Nasution", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Robby Irham Nasution.jpg" },
  { id: "90", name: "Muhammad Ierfan Fathy", prodi: "Manajemen", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Muhammad Ierfan Fathy.jpg" },
  { id: "91", name: "Farrel Ozora Samuel Samosir", prodi: "Teknologi Industri Pertanian", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Farrel Ozora Samuel Samosir.jpg" },
  { id: "92", name: "Muhammad Fata Azzaki", prodi: "Informatika", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Muhammad Fata Azzaki.jpg" },
  { id: "93", name: "Moses Farel Cristian", prodi: "Manajemen", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Moses Farel Cristian.jpg" },
  { id: "94", name: "Maulana Firyalfasya Alifianto", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Maulana Firyalfasya Alifianto.jpg" },
  { id: "95", name: "Tegar Adidtya Pratama", prodi: "Informatika", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Tegar Adidtya Pratama_v2.jpg" },
  { id: "96", name: "Ahmad Fajri Kusuma", prodi: "Teknik Kimia", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Ahmad Fajri Kusuma.jpg" },
  { id: "97", name: "Berlian Paramita Pawestri", prodi: "Teknik Logistik", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Berlian Paramita Pawestri_v2.jpg" },
  { id: "98", name: "Aura Hyunarisasi", prodi: "Manajemen", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Aura Hyunarisasi_v2.jpg" },
  { id: "99", name: "Jihan Salwa Putri Syarifuddin", prodi: "Akuntansi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Jihan Salwa Puti Syariffudin.jpg" },
  { id: "100", name: "Bunga Hisanah Dyandra Rahmatullah", prodi: "Manajemen Rekayasa", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Bunga Hisanah Dyandra Rahmatullah_v2.jpg" },
  { id: "101", name: "Hilda Zana Yogya Nugrahaini", prodi: "Manajemen", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Hilda Zana Yogya Nugrahaini.jpg" },
  { id: "102", name: "Nadya Shafwah Al Qibthiyah", prodi: "Sistem Informasi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Nadya Shafwah Al Qibthiya.jpg" },
  { id: "103", name: "Alya Fadhilatun Nisa", prodi: "Teknik Kimia", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Alya Fadhilatun Nisa_v2.jpg" },
  { id: "104", name: "Novatimah Dewi Maharani", prodi: "Sistem Informasi", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Novatimah Dewi Maharani.jpg" },
  { id: "105", name: "Calista Alysia Ramadhani", prodi: "Teknik Kimia", role: "Anggota Mentor Kelompok", divisionId: "mentor", divisionName: "Mentor" , image: "/fotoAnggota/Mentor Kelompok/Calista Alysia Ramadhani.jpg" },

  // Humas & Sponsorship
  { id: "106", name: "Rizqina Kautsarina", prodi: "Teknologi Industri Pertanian", role: "Anggota Konsumsi", divisionId: "logtrans", divisionName: "Logtrans & Konsumsi" , image: "/fotoAnggota/Logtrans/Rizqina Kautsarina.jpg" },
  { id: "107", name: "Farah Nisyafira", prodi: "Ekonomi Syariah", role: "Anggota Konsumsi", divisionId: "logtrans", divisionName: "Logtrans & Konsumsi" , image: "/fotoAnggota/Logtrans/Farah Nisyafira.jpg" },
  { id: "108", name: "Nisriina Naura Maulina", prodi: "Ekonomi Syariah", role: "Anggota Konsumsi", divisionId: "logtrans", divisionName: "Logtrans & Konsumsi" , image: "/fotoAnggota/Logtrans/Nisriina Naura Maulina.jpg" },
  { id: "109", name: "Lidya Oktavia", prodi: "Manajemen", role: "Anggota Konsumsi", divisionId: "logtrans", divisionName: "Logtrans & Konsumsi" , image: "/fotoAnggota/Logtrans/Lidya Oktavia.jpg" },
  { id: "110", name: "Raya Kiran Ambhieya", prodi: "Teknik Kimia", role: "Anggota Konsumsi", divisionId: "logtrans", divisionName: "Logtrans & Konsumsi" , image: "/fotoAnggota/Logtrans/Raya Kiran Ambhieya.jpg" },
  { id: "111", name: "Shelia Dwi Faradina", prodi: "Teknik Logistik", role: "Anggota Humas & Sponsorship", divisionId: "humas", divisionName: "Humas & Sponsor" , image: "/fotoAnggota/Sponsorship/Shelia Dwi Faradina.jpg" },
  { id: "112", name: "Faisal Dwi Herlambang", prodi: "Manajemen", role: "Anggota Humas & Sponsorship", divisionId: "humas", divisionName: "Humas & Sponsor" , image: "/fotoAnggota/Sponsorship/Faisal Dwi Herlambang.jpg" },
  { id: "113", name: "M. Aliefta Rizky Alvansyah", prodi: "Informatika", role: "Anggota Humas & Sponsorship", divisionId: "humas", divisionName: "Humas & Sponsor", image: "/fotoAnggota/Sponsorship/M. Aliefta Rizky Alvansyah.jpg" },
];

export default function AnggotaDivisi() {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize(); // set on initial render
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeDivision = useMemo(() => {
    return DIVISIONS.find((d) => d.id === selectedDivisionId) || null;
  }, [selectedDivisionId]);

  const filteredMembers = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchDivision =
        selectedDivisionId === "all" || m.divisionId === selectedDivisionId;
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.divisionName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDivision && matchSearch;
    });
  }, [selectedDivisionId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDivisionId, searchQuery]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const displayedMembers = useMemo(() => {
    if (!isMobile) return filteredMembers;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, isMobile, currentPage]);

  return (
    <div className={styles.wrapper}>
      {/* Search & Filter Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama, prodi, atau jabatan panitia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Division Filter Tabs */}
        <div className={styles.tabsList}>
          <button
            className={`${styles.tabBtn} ${
              selectedDivisionId === "all" ? styles.tabActive : ""
            }`}
            onClick={() => setSelectedDivisionId("all")}
          >
            <Users size={16} /> Semua Divisi
            <span className={styles.badgeCount}>{MEMBERS.length + 10}</span>
          </button>

          {DIVISIONS.map((div) => {
            const count = MEMBERS.filter((m) => m.divisionId === div.id).length;
            return (
              <button
                key={div.id}
                className={`${styles.tabBtn} ${
                  selectedDivisionId === div.id ? styles.tabActive : ""
                }`}
                onClick={() => setSelectedDivisionId(div.id)}
              >
                {div.icon} {div.shortName}
                <span className={styles.badgeCount}>{count}</span>
              </button>
            );
          })}
          <div className={styles.tabBtn} style={{ cursor: "default" }}>
            <GraduationCap size={16} /> IC
            <span className={styles.badgeCount}>10</span>
          </div>
        </div>
      </div>

      {/* Banner Summary for Active Division */}
      {activeDivision && (
        <div className={styles.divisionBanner}>
          <div>
            <h4 className={styles.bannerTitle}>{activeDivision.name}</h4>
            <p className={styles.bannerDesc}>{activeDivision.description}</p>
          </div>
          <span className={styles.bannerBadge}>
            {activeDivision.koordinator}
          </span>
        </div>
      )}

      {/* Members Grid */}
      <div className={styles.membersGrid}>
        {displayedMembers.length > 0 ? (
          displayedMembers.map((member) => {
            // Seluruh foto — termasuk /fotoAnggota — kini lewat pipeline varian.
            // Selain memperkecil ukuran, ini memperbaiki potret di direktori
            // "SC&Acara": karakter "&" pada path membuat optimizer next/image
            // membalas 400, sedangkan slug varian mengubahnya jadi "sc-acara".
            const memberImageSrc = member.image ? getCloudinaryUrl(member.image, 0) : "";

            return (
            <div 
              key={member.id} 
              className={styles.memberCard} 
              onClick={() => setSelectedMember(member)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.memberIconBox} style={member.image ? { padding: 0, overflow: 'hidden', border: 'none' } : {}}>
                {member.image ? (
                  <Image src={memberImageSrc} alt={member.name} width={200} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className={styles.memberInfo}>
                <h5 className={styles.memberName}>{member.name}</h5>
                <p className={styles.memberRole}>{member.role}</p>
                <div className={styles.tagsWrapper}>
                  <span className={styles.prodiTag}>{member.prodi}</span>
                  <span className={styles.divisionTag}>{member.divisionName}</span>
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <div className={styles.emptySearch}>
            Tidak ditemukan panitia dengan kata kunci &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>

      {/* Pagination Controls (Mobile only) */}
      {isMobile && totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={`${styles.pageBtn} ${styles.btnPrev}`} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className={styles.dotsWrapper}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <span 
                key={i} 
                className={`${styles.dot} ${currentPage === i + 1 ? styles.dotActive : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              />
            ))}
          </div>

          <button 
            className={`${styles.pageBtn} ${styles.btnNext}`} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modal Popup */}
      {selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMember(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedMember(null)}>
              ×
            </button>
            <div className={styles.modalPhotoContainer}>
              <div className={styles.modalPhotoBox}>
                {selectedMember.image ? (
                  <Image 
                    src={getCloudinaryUrl(selectedMember.image, 0)}
                    alt={selectedMember.name} 
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }} 
                  />
                ) : (
                  <User size={80} color="rgba(255,255,255,0.2)" />
                )}
              </div>
            </div>
            <div className={styles.modalInfo}>
              <h3 className={styles.modalName}>{selectedMember.name}</h3>
              <p className={styles.modalRole}>{selectedMember.role}</p>
              <div className={styles.modalTags}>
                <span className={styles.modalProdiTag}>{selectedMember.prodi}</span>
                <span className={styles.modalDivTag}>{selectedMember.divisionName}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
