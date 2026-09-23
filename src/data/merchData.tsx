import React from "react";
import { Shirt, Sparkles, ShoppingBag, Award } from "lucide-react";

export interface MerchItem {
  id: number;
  title: string;
  desc: string;
  price: string;
  badge: string;
  badgeType: "new" | "trending" | "best" | "popular";
  rating: number;
  reviews: number;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  gradient: string;
  image?: string;
}

export const MERCH_ITEMS: MerchItem[] = [
  {
    id: 1,
    title: "Kaos Aethera",
    desc: "Combed 30s hitam elegan dengan sablon plastisol tahan lama.",
    price: "Rp 80.000",
    badge: "BEST SELLER",
    badgeType: "best",
    rating: 4.8,
    reviews: 120,
    icon: Shirt,
    gradient: "linear-gradient(145deg, #d4eaf7 0%, #a8d8ea 50%, #e8f4f8 100%)",
    image: "/Merchendise/Kaos 1.png",
  },
  {
    id: 2,
    title: "Kaos Aethera",
    desc: "Combed 30s hitam elegan dengan sablon plastisol tahan lama.",
    price: "Rp 80.000",
    badge: "BEST SELLER",
    badgeType: "best",
    rating: 4.8,
    reviews: 120,
    icon: Shirt,
    gradient: "linear-gradient(145deg, #d4eaf7 0%, #a8d8ea 50%, #e8f4f8 100%)",
    image: "/Merchendise/Kaos 2.png",
  },
  {
    id: 3,
    title: "Kaos Aethera",
    desc: "Combed 30s hitam elegan dengan sablon plastisol tahan lama.",
    price: "Rp 80.000",
    badge: "BEST SELLER",
    badgeType: "best",
    rating: 4.8,
    reviews: 120,
    icon: Shirt,
    gradient: "linear-gradient(145deg, #d4eaf7 0%, #a8d8ea 50%, #e8f4f8 100%)",
    image: "/Merchendise/Kaos 3.png",
  },
  {
    id: 4,
    title: "Sticker Pack",
    desc: "8 Rasi eksklusif vinyl anti air dengan die-cut presisi.",
    price: "Rp 10.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.6,
    reviews: 89,
    icon: Sparkles,
    gradient: "linear-gradient(145deg, #e0f0fa 0%, #b8dff0 50%, #eaf5fc 100%)",
    image: "/Merchendise/Stickerpack.png",
  },
  {
    id: 5,
    title: "Totebag",
    desc: "Kanvas tebal putih tulang dengan kompartemen luas.",
    price: "Rp 20.000",
    badge: "TRENDING",
    badgeType: "trending",
    rating: 4.7,
    reviews: 98,
    icon: ShoppingBag,
    gradient: "linear-gradient(145deg, #dce8ee 0%, #b4ced9 50%, #e6eff4 100%)",
    image: "/Merchendise/Totebag.png",
  },
  {
    id: 6,
    title: "Tumbler",
    desc: "Logam premium Aethera logo dengan finishing emas mewah.",
    price: "Rp 70.000",
    badge: "POPULAR",
    badgeType: "popular",
    rating: 4.9,
    reviews: 63,
    icon: Award,
    gradient: "linear-gradient(145deg, #cfe2ea 0%, #a3c9d9 50%, #dfedf3 100%)",
    image: "/Merchendise/Tumbler.png",
  },
  {
    id: 7,
    title: "Lanyard",
    desc: "Tali ID card premium dengan clip metal dan sablon logo Aethera.",
    price: "Rp 13.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.5,
    reviews: 75,
    icon: Award,
    gradient: "linear-gradient(145deg, #d8edf5 0%, #aed4e6 50%, #e2f1f8 100%)",
    image: "/Merchendise/Lanyard.png",
  },
  {
    id: 8,
    title: "Topi",
    desc: "Tali ID card premium dengan clip metal dan sablon logo Aethera.",
    price: "Rp 30.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.5,
    reviews: 75,
    icon: Award,
    gradient: "linear-gradient(145deg, #d8edf5 0%, #aed4e6 50%, #e2f1f8 100%)",
    image: "/Merchendise/Topi.png",
  },
  {
    id: 9,
    title: "Kipas",
    desc: "Tali ID card premium dengan clip metal dan sablon logo Aethera.",
    price: "Rp 10.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.5,
    reviews: 75,
    icon: Award,
    gradient: "linear-gradient(145deg, #d8edf5 0%, #aed4e6 50%, #e2f1f8 100%)",
    image: "/Merchendise/Kipas.png",
  },
  {
    id: 10,
    title: "Ganci",
    desc: "Tali ID card premium dengan clip metal dan sablon logo Aethera.",
    price: "Rp 10.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.5,
    reviews: 75,
    icon: Award,
    gradient: "linear-gradient(145deg, #d8edf5 0%, #aed4e6 50%, #e2f1f8 100%)",
    image: "/Merchendise/Ganci.png",
  },
];
