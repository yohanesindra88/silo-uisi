export function getCoordinatesFromLatLng(lat: number, lng: number, radius: number) {
  // Konversi derajat ke radian
  const phi = (90 - lat) * (Math.PI / 180);
  // Hapus + 180 untuk merotasi marker tepat ke sisi sebaliknya (karena sebelumnya terbalik 180 derajat)
  const theta = (lng) * (Math.PI / 180);

  // Kalkulasi ke koordinat ruang 3D
  // Catatan: Tanda minus atau plus bisa bervariasi tergantung bagaimana 
  // orientasi rotasi awal (rotation) model GLTF kamu saat diekspor.
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);

  return { x, y, z };
}
