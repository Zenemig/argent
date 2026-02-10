import type { LensStock } from "./types";
import type { LensMount } from "./constants";

function lens(
  id: string,
  make: string,
  name: string,
  mount: LensMount,
  focalLength: number,
  maxAperture: number,
): LensStock {
  return { id, make, name, mount, focal_length: focalLength, max_aperture: maxAperture };
}

/**
 * Comprehensive lens stock catalog — ~220 lenses.
 * Read-only seed data populated into Dexie `lensStock` table.
 */
export const lensStocks: LensStock[] = [
  // ---------------------------------------------------------------------------
  // Nikon F-mount — AI / AI-S
  // ---------------------------------------------------------------------------
  lens("nikon-20-3.5-ais", "Nikon", "Nikkor 20mm f/3.5 AI-S", "Nikon F", 20, 3.5),
  lens("nikon-24-2.8-ais", "Nikon", "Nikkor 24mm f/2.8 AI-S", "Nikon F", 24, 2.8),
  lens("nikon-28-2.8-ais", "Nikon", "Nikkor 28mm f/2.8 AI-S", "Nikon F", 28, 2.8),
  lens("nikon-35-1.4-ais", "Nikon", "Nikkor 35mm f/1.4 AI-S", "Nikon F", 35, 1.4),
  lens("nikon-35-2-ais", "Nikon", "Nikkor 35mm f/2 AI-S", "Nikon F", 35, 2),
  lens("nikon-50-1.2-ais", "Nikon", "Nikkor 50mm f/1.2 AI-S", "Nikon F", 50, 1.2),
  lens("nikon-50-1.4-ais", "Nikon", "Nikkor 50mm f/1.4 AI-S", "Nikon F", 50, 1.4),
  lens("nikon-50-1.8-ais", "Nikon", "Nikkor 50mm f/1.8 AI-S", "Nikon F", 50, 1.8),
  lens("nikon-85-1.4-ais", "Nikon", "Nikkor 85mm f/1.4 AI-S", "Nikon F", 85, 1.4),
  lens("nikon-85-2-ais", "Nikon", "Nikkor 85mm f/2 AI-S", "Nikon F", 85, 2),
  lens("nikon-105-2.5-ais", "Nikon", "Nikkor 105mm f/2.5 AI-S", "Nikon F", 105, 2.5),
  lens("nikon-135-2.8-ais", "Nikon", "Nikkor 135mm f/2.8 AI-S", "Nikon F", 135, 2.8),
  lens("nikon-180-2.8-ais", "Nikon", "Nikkor 180mm f/2.8 AI-S ED", "Nikon F", 180, 2.8),
  lens("nikon-200-4-ais", "Nikon", "Nikkor 200mm f/4 AI-S", "Nikon F", 200, 4),

  // ---------------------------------------------------------------------------
  // Nikon F-mount — AF / AF-D / AF-S
  // ---------------------------------------------------------------------------
  lens("nikon-24-2.8d", "Nikon", "AF Nikkor 24mm f/2.8D", "Nikon F", 24, 2.8),
  lens("nikon-28-2.8d", "Nikon", "AF Nikkor 28mm f/2.8D", "Nikon F", 28, 2.8),
  lens("nikon-35-2d", "Nikon", "AF Nikkor 35mm f/2D", "Nikon F", 35, 2),
  lens("nikon-50-1.4d", "Nikon", "AF Nikkor 50mm f/1.4D", "Nikon F", 50, 1.4),
  lens("nikon-50-1.8d", "Nikon", "AF Nikkor 50mm f/1.8D", "Nikon F", 50, 1.8),
  lens("nikon-85-1.4d", "Nikon", "AF Nikkor 85mm f/1.4D", "Nikon F", 85, 1.4),
  lens("nikon-85-1.8d", "Nikon", "AF Nikkor 85mm f/1.8D", "Nikon F", 85, 1.8),
  lens("nikon-105-2d-dc", "Nikon", "AF DC-Nikkor 105mm f/2D", "Nikon F", 105, 2),
  lens("nikon-135-2d-dc", "Nikon", "AF DC-Nikkor 135mm f/2D", "Nikon F", 135, 2),
  lens("nikon-24-70-2.8", "Nikon", "AF-S Nikkor 24-70mm f/2.8G ED", "Nikon F", 24, 2.8),
  lens("nikon-70-200-2.8", "Nikon", "AF-S Nikkor 70-200mm f/2.8G VR", "Nikon F", 70, 2.8),
  lens("nikon-28-70-2.8d", "Nikon", "AF-S Nikkor 28-70mm f/2.8D", "Nikon F", 28, 2.8),
  lens("nikon-80-200-2.8d", "Nikon", "AF Nikkor 80-200mm f/2.8D ED", "Nikon F", 80, 2.8),

  // ---------------------------------------------------------------------------
  // Canon FD
  // ---------------------------------------------------------------------------
  lens("canon-fd-24-2.8", "Canon", "FD 24mm f/2.8", "Canon FD", 24, 2.8),
  lens("canon-fd-28-2.8", "Canon", "FD 28mm f/2.8", "Canon FD", 28, 2.8),
  lens("canon-fd-35-2", "Canon", "FD 35mm f/2", "Canon FD", 35, 2),
  lens("canon-fd-50-1.2l", "Canon", "FD 50mm f/1.2L", "Canon FD", 50, 1.2),
  lens("canon-fd-50-1.4", "Canon", "FD 50mm f/1.4", "Canon FD", 50, 1.4),
  lens("canon-fd-50-1.8", "Canon", "FD 50mm f/1.8", "Canon FD", 50, 1.8),
  lens("canon-nfd-50-1.4", "Canon", "New FD 50mm f/1.4", "Canon FD", 50, 1.4),
  lens("canon-nfd-50-1.8", "Canon", "New FD 50mm f/1.8", "Canon FD", 50, 1.8),
  lens("canon-fd-85-1.2l", "Canon", "FD 85mm f/1.2L", "Canon FD", 85, 1.2),
  lens("canon-fd-85-1.8", "Canon", "FD 85mm f/1.8", "Canon FD", 85, 1.8),
  lens("canon-fd-100-2.8", "Canon", "FD 100mm f/2.8", "Canon FD", 100, 2.8),
  lens("canon-fd-135-2", "Canon", "FD 135mm f/2", "Canon FD", 135, 2),
  lens("canon-fd-135-2.5", "Canon", "FD 135mm f/2.5", "Canon FD", 135, 2.5),
  lens("canon-fd-200-2.8", "Canon", "FD 200mm f/2.8", "Canon FD", 200, 2.8),

  // ---------------------------------------------------------------------------
  // Canon EF
  // ---------------------------------------------------------------------------
  lens("canon-ef-24-1.4l", "Canon", "EF 24mm f/1.4L USM", "Canon EF", 24, 1.4),
  lens("canon-ef-28-1.8", "Canon", "EF 28mm f/1.8 USM", "Canon EF", 28, 1.8),
  lens("canon-ef-35-1.4l", "Canon", "EF 35mm f/1.4L USM", "Canon EF", 35, 1.4),
  lens("canon-ef-35-2", "Canon", "EF 35mm f/2", "Canon EF", 35, 2),
  lens("canon-ef-50-1.2l", "Canon", "EF 50mm f/1.2L USM", "Canon EF", 50, 1.2),
  lens("canon-ef-50-1.4", "Canon", "EF 50mm f/1.4 USM", "Canon EF", 50, 1.4),
  lens("canon-ef-50-1.8-ii", "Canon", "EF 50mm f/1.8 II", "Canon EF", 50, 1.8),
  lens("canon-ef-85-1.2l", "Canon", "EF 85mm f/1.2L USM", "Canon EF", 85, 1.2),
  lens("canon-ef-85-1.8", "Canon", "EF 85mm f/1.8 USM", "Canon EF", 85, 1.8),
  lens("canon-ef-100-2", "Canon", "EF 100mm f/2 USM", "Canon EF", 100, 2),
  lens("canon-ef-135-2l", "Canon", "EF 135mm f/2L USM", "Canon EF", 135, 2),
  lens("canon-ef-24-70-2.8l", "Canon", "EF 24-70mm f/2.8L USM", "Canon EF", 24, 2.8),
  lens("canon-ef-70-200-2.8l", "Canon", "EF 70-200mm f/2.8L USM", "Canon EF", 70, 2.8),
  lens("canon-ef-16-35-2.8l", "Canon", "EF 16-35mm f/2.8L USM", "Canon EF", 16, 2.8),

  // ---------------------------------------------------------------------------
  // Pentax K
  // ---------------------------------------------------------------------------
  lens("pentax-k-28-3.5", "Pentax", "SMC Pentax-M 28mm f/3.5", "Pentax K", 28, 3.5),
  lens("pentax-k-35-2.8", "Pentax", "SMC Pentax-M 35mm f/2.8", "Pentax K", 35, 2.8),
  lens("pentax-k-50-1.4", "Pentax", "SMC Pentax-M 50mm f/1.4", "Pentax K", 50, 1.4),
  lens("pentax-k-50-1.7", "Pentax", "SMC Pentax-M 50mm f/1.7", "Pentax K", 50, 1.7),
  lens("pentax-k-50-2", "Pentax", "SMC Pentax-M 50mm f/2", "Pentax K", 50, 2),
  lens("pentax-k-85-2", "Pentax", "SMC Pentax-M 85mm f/2", "Pentax K", 85, 2),
  lens("pentax-k-100-2.8", "Pentax", "SMC Pentax-M 100mm f/2.8", "Pentax K", 100, 2.8),
  lens("pentax-k-135-3.5", "Pentax", "SMC Pentax-M 135mm f/3.5", "Pentax K", 135, 3.5),
  lens("pentax-k-200-4", "Pentax", "SMC Pentax-M 200mm f/4", "Pentax K", 200, 4),
  lens("pentax-a-50-1.4", "Pentax", "SMC Pentax-A 50mm f/1.4", "Pentax K", 50, 1.4),
  lens("pentax-a-50-1.7", "Pentax", "SMC Pentax-A 50mm f/1.7", "Pentax K", 50, 1.7),
  lens("pentax-a-35-2", "Pentax", "SMC Pentax-A 35mm f/2", "Pentax K", 35, 2),
  lens("pentax-fa-31-1.8", "Pentax", "SMC Pentax-FA 31mm f/1.8 AL Limited", "Pentax K", 31, 1.8),
  lens("pentax-fa-43-1.9", "Pentax", "SMC Pentax-FA 43mm f/1.9 Limited", "Pentax K", 43, 1.9),
  lens("pentax-fa-77-1.8", "Pentax", "SMC Pentax-FA 77mm f/1.8 Limited", "Pentax K", 77, 1.8),

  // ---------------------------------------------------------------------------
  // Olympus OM
  // ---------------------------------------------------------------------------
  lens("olympus-om-21-3.5", "Olympus", "OM Zuiko 21mm f/3.5", "Olympus OM", 21, 3.5),
  lens("olympus-om-24-2.8", "Olympus", "OM Zuiko 24mm f/2.8", "Olympus OM", 24, 2.8),
  lens("olympus-om-28-2.8", "Olympus", "OM Zuiko 28mm f/2.8", "Olympus OM", 28, 2.8),
  lens("olympus-om-28-3.5", "Olympus", "OM Zuiko 28mm f/3.5", "Olympus OM", 28, 3.5),
  lens("olympus-om-35-2", "Olympus", "OM Zuiko 35mm f/2", "Olympus OM", 35, 2),
  lens("olympus-om-35-2.8", "Olympus", "OM Zuiko 35mm f/2.8", "Olympus OM", 35, 2.8),
  lens("olympus-om-50-1.2", "Olympus", "OM Zuiko 50mm f/1.2", "Olympus OM", 50, 1.2),
  lens("olympus-om-50-1.4", "Olympus", "OM Zuiko 50mm f/1.4", "Olympus OM", 50, 1.4),
  lens("olympus-om-50-1.8", "Olympus", "OM Zuiko 50mm f/1.8", "Olympus OM", 50, 1.8),
  lens("olympus-om-85-2", "Olympus", "OM Zuiko 85mm f/2", "Olympus OM", 85, 2),
  lens("olympus-om-100-2.8", "Olympus", "OM Zuiko 100mm f/2.8", "Olympus OM", 100, 2.8),
  lens("olympus-om-135-2.8", "Olympus", "OM Zuiko 135mm f/2.8", "Olympus OM", 135, 2.8),
  lens("olympus-om-135-3.5", "Olympus", "OM Zuiko 135mm f/3.5", "Olympus OM", 135, 3.5),
  lens("olympus-om-200-4", "Olympus", "OM Zuiko 200mm f/4", "Olympus OM", 200, 4),
  lens("olympus-om-90-2-macro", "Olympus", "OM Zuiko 90mm f/2 Macro", "Olympus OM", 90, 2),

  // ---------------------------------------------------------------------------
  // Minolta MD/MC
  // ---------------------------------------------------------------------------
  lens("minolta-md-24-2.8", "Minolta", "MD 24mm f/2.8", "Minolta MD/MC", 24, 2.8),
  lens("minolta-md-28-2.8", "Minolta", "MD 28mm f/2.8", "Minolta MD/MC", 28, 2.8),
  lens("minolta-md-35-1.8", "Minolta", "MD 35mm f/1.8", "Minolta MD/MC", 35, 1.8),
  lens("minolta-md-35-2.8", "Minolta", "MD 35mm f/2.8", "Minolta MD/MC", 35, 2.8),
  lens("minolta-md-50-1.2", "Minolta", "MD 50mm f/1.2", "Minolta MD/MC", 50, 1.2),
  lens("minolta-md-50-1.4", "Minolta", "MD 50mm f/1.4", "Minolta MD/MC", 50, 1.4),
  lens("minolta-md-50-1.7", "Minolta", "MD 50mm f/1.7", "Minolta MD/MC", 50, 1.7),
  lens("minolta-mc-58-1.2", "Minolta", "MC Rokkor 58mm f/1.2", "Minolta MD/MC", 58, 1.2),
  lens("minolta-mc-58-1.4", "Minolta", "MC Rokkor 58mm f/1.4", "Minolta MD/MC", 58, 1.4),
  lens("minolta-md-85-2", "Minolta", "MD 85mm f/2", "Minolta MD/MC", 85, 2),
  lens("minolta-md-100-2.5", "Minolta", "MD 100mm f/2.5", "Minolta MD/MC", 100, 2.5),
  lens("minolta-md-135-2.8", "Minolta", "MD 135mm f/2.8", "Minolta MD/MC", 135, 2.8),
  lens("minolta-md-135-3.5", "Minolta", "MD 135mm f/3.5", "Minolta MD/MC", 135, 3.5),
  lens("minolta-md-200-4", "Minolta", "MD 200mm f/4", "Minolta MD/MC", 200, 4),

  // ---------------------------------------------------------------------------
  // Leica M
  // ---------------------------------------------------------------------------
  lens("leica-m-21-2.8-elmarit", "Leica", "Elmarit-M 21mm f/2.8", "Leica M", 21, 2.8),
  lens("leica-m-28-2-summicron", "Leica", "Summicron-M 28mm f/2 ASPH", "Leica M", 28, 2),
  lens("leica-m-28-2.8-elmarit", "Leica", "Elmarit-M 28mm f/2.8", "Leica M", 28, 2.8),
  lens("leica-m-35-1.4-summilux", "Leica", "Summilux-M 35mm f/1.4 ASPH", "Leica M", 35, 1.4),
  lens("leica-m-35-2-summicron", "Leica", "Summicron-M 35mm f/2 ASPH", "Leica M", 35, 2),
  lens("leica-m-35-2.5-summarit", "Leica", "Summarit-M 35mm f/2.5", "Leica M", 35, 2.5),
  lens("leica-m-50-0.95-noctilux", "Leica", "Noctilux-M 50mm f/0.95 ASPH", "Leica M", 50, 0.95),
  lens("leica-m-50-1.4-summilux", "Leica", "Summilux-M 50mm f/1.4 ASPH", "Leica M", 50, 1.4),
  lens("leica-m-50-2-summicron", "Leica", "Summicron-M 50mm f/2", "Leica M", 50, 2),
  lens("leica-m-50-2.8-elmar", "Leica", "Elmar-M 50mm f/2.8", "Leica M", 50, 2.8),
  lens("leica-m-75-1.4-summilux", "Leica", "Summilux-M 75mm f/1.4", "Leica M", 75, 1.4),
  lens("leica-m-75-2-summicron", "Leica", "Summicron-M 75mm f/2 APO", "Leica M", 75, 2),
  lens("leica-m-90-2-summicron", "Leica", "Summicron-M 90mm f/2", "Leica M", 90, 2),
  lens("leica-m-90-2.8-elmarit", "Leica", "Elmarit-M 90mm f/2.8", "Leica M", 90, 2.8),
  lens("leica-m-135-3.4-apo", "Leica", "APO-Telyt-M 135mm f/3.4", "Leica M", 135, 3.4),

  // ---------------------------------------------------------------------------
  // Leica R
  // ---------------------------------------------------------------------------
  lens("leica-r-28-2.8-elmarit", "Leica", "Elmarit-R 28mm f/2.8", "Leica R", 28, 2.8),
  lens("leica-r-35-2-summicron", "Leica", "Summicron-R 35mm f/2", "Leica R", 35, 2),
  lens("leica-r-50-1.4-summilux", "Leica", "Summilux-R 50mm f/1.4", "Leica R", 50, 1.4),
  lens("leica-r-50-2-summicron", "Leica", "Summicron-R 50mm f/2", "Leica R", 50, 2),
  lens("leica-r-90-2-summicron", "Leica", "Summicron-R 90mm f/2", "Leica R", 90, 2),

  // ---------------------------------------------------------------------------
  // Contax/Yashica (Carl Zeiss)
  // ---------------------------------------------------------------------------
  lens("zeiss-cy-18-4-distagon", "Carl Zeiss", "Distagon T* 18mm f/4", "Contax/Yashica", 18, 4),
  lens("zeiss-cy-25-2.8-distagon", "Carl Zeiss", "Distagon T* 25mm f/2.8", "Contax/Yashica", 25, 2.8),
  lens("zeiss-cy-28-2.8-distagon", "Carl Zeiss", "Distagon T* 28mm f/2.8", "Contax/Yashica", 28, 2.8),
  lens("zeiss-cy-35-1.4-distagon", "Carl Zeiss", "Distagon T* 35mm f/1.4", "Contax/Yashica", 35, 1.4),
  lens("zeiss-cy-35-2.8-distagon", "Carl Zeiss", "Distagon T* 35mm f/2.8", "Contax/Yashica", 35, 2.8),
  lens("zeiss-cy-50-1.4-planar", "Carl Zeiss", "Planar T* 50mm f/1.4", "Contax/Yashica", 50, 1.4),
  lens("zeiss-cy-50-1.7-planar", "Carl Zeiss", "Planar T* 50mm f/1.7", "Contax/Yashica", 50, 1.7),
  lens("zeiss-cy-85-1.4-planar", "Carl Zeiss", "Planar T* 85mm f/1.4", "Contax/Yashica", 85, 1.4),
  lens("zeiss-cy-100-2-makro", "Carl Zeiss", "Makro-Planar T* 100mm f/2.8", "Contax/Yashica", 100, 2.8),
  lens("zeiss-cy-135-2.8-sonnar", "Carl Zeiss", "Sonnar T* 135mm f/2.8", "Contax/Yashica", 135, 2.8),
  lens("zeiss-cy-180-2.8-sonnar", "Carl Zeiss", "Sonnar T* 180mm f/2.8", "Contax/Yashica", 180, 2.8),

  // ---------------------------------------------------------------------------
  // Contax G
  // ---------------------------------------------------------------------------
  lens("contax-g-21-2.8", "Carl Zeiss", "Biogon T* 21mm f/2.8 G", "Contax G", 21, 2.8),
  lens("contax-g-28-2.8", "Carl Zeiss", "Biogon T* 28mm f/2.8 G", "Contax G", 28, 2.8),
  lens("contax-g-35-2", "Carl Zeiss", "Planar T* 35mm f/2 G", "Contax G", 35, 2),
  lens("contax-g-45-2", "Carl Zeiss", "Planar T* 45mm f/2 G", "Contax G", 45, 2),
  lens("contax-g-90-2.8", "Carl Zeiss", "Sonnar T* 90mm f/2.8 G", "Contax G", 90, 2.8),

  // ---------------------------------------------------------------------------
  // Voigtlander VM (Leica M-mount)
  // ---------------------------------------------------------------------------
  lens("voigt-vm-12-5.6", "Voigtlander", "Ultra Wide-Heliar 12mm f/5.6 III", "Voigtlander VM", 12, 5.6),
  lens("voigt-vm-15-4.5", "Voigtlander", "Super Wide-Heliar 15mm f/4.5 III", "Voigtlander VM", 15, 4.5),
  lens("voigt-vm-21-1.4", "Voigtlander", "Nokton 21mm f/1.4 ASPH", "Voigtlander VM", 21, 1.4),
  lens("voigt-vm-21-3.5", "Voigtlander", "Color-Skopar 21mm f/3.5", "Voigtlander VM", 21, 3.5),
  lens("voigt-vm-28-2", "Voigtlander", "Ultron 28mm f/2", "Voigtlander VM", 28, 2),
  lens("voigt-vm-35-1.2", "Voigtlander", "Nokton 35mm f/1.2 ASPH III", "Voigtlander VM", 35, 1.2),
  lens("voigt-vm-35-1.4", "Voigtlander", "Nokton 35mm f/1.4", "Voigtlander VM", 35, 1.4),
  lens("voigt-vm-35-2.5", "Voigtlander", "Color-Skopar 35mm f/2.5 PII", "Voigtlander VM", 35, 2.5),
  lens("voigt-vm-40-1.2", "Voigtlander", "Nokton 40mm f/1.2 ASPH", "Voigtlander VM", 40, 1.2),
  lens("voigt-vm-50-1.1", "Voigtlander", "Nokton 50mm f/1.1", "Voigtlander VM", 50, 1.1),
  lens("voigt-vm-50-1.2", "Voigtlander", "Nokton 50mm f/1.2 ASPH", "Voigtlander VM", 50, 1.2),
  lens("voigt-vm-50-1.5", "Voigtlander", "Nokton 50mm f/1.5 ASPH II", "Voigtlander VM", 50, 1.5),
  lens("voigt-vm-50-2", "Voigtlander", "APO-Lanthar 50mm f/2", "Voigtlander VM", 50, 2),
  lens("voigt-vm-75-1.5", "Voigtlander", "Nokton 75mm f/1.5 ASPH", "Voigtlander VM", 75, 1.5),

  // ---------------------------------------------------------------------------
  // Hasselblad V
  // ---------------------------------------------------------------------------
  lens("hblad-v-40-4", "Hasselblad", "Distagon CF 40mm f/4 FLE", "Hasselblad V", 40, 4),
  lens("hblad-v-50-4", "Hasselblad", "Distagon CF 50mm f/4 FLE", "Hasselblad V", 50, 4),
  lens("hblad-v-60-3.5", "Hasselblad", "Distagon CB 60mm f/3.5 T*", "Hasselblad V", 60, 3.5),
  lens("hblad-v-80-2.8", "Hasselblad", "Planar CF 80mm f/2.8 T*", "Hasselblad V", 80, 2.8),
  lens("hblad-v-100-3.5", "Hasselblad", "Planar CF 100mm f/3.5 T*", "Hasselblad V", 100, 3.5),
  lens("hblad-v-120-4-macro", "Hasselblad", "Makro-Planar CF 120mm f/4 T*", "Hasselblad V", 120, 4),
  lens("hblad-v-150-4", "Hasselblad", "Sonnar CF 150mm f/4 T*", "Hasselblad V", 150, 4),
  lens("hblad-v-250-5.6", "Hasselblad", "Sonnar CF 250mm f/5.6 T*", "Hasselblad V", 250, 5.6),

  // ---------------------------------------------------------------------------
  // Mamiya RB/RZ67
  // ---------------------------------------------------------------------------
  lens("mamiya-rz-50-4.5", "Mamiya", "Sekor Z 50mm f/4.5 W", "Mamiya RB/RZ67", 50, 4.5),
  lens("mamiya-rz-65-4", "Mamiya", "Sekor Z 65mm f/4", "Mamiya RB/RZ67", 65, 4),
  lens("mamiya-rz-90-3.5", "Mamiya", "Sekor Z 90mm f/3.5 W", "Mamiya RB/RZ67", 90, 3.5),
  lens("mamiya-rz-110-2.8", "Mamiya", "Sekor Z 110mm f/2.8", "Mamiya RB/RZ67", 110, 2.8),
  lens("mamiya-rz-127-3.8", "Mamiya", "Sekor RB 127mm f/3.8", "Mamiya RB/RZ67", 127, 3.8),
  lens("mamiya-rz-150-3.5", "Mamiya", "Sekor Z 150mm f/3.5", "Mamiya RB/RZ67", 150, 3.5),
  lens("mamiya-rz-180-4.5", "Mamiya", "Sekor Z 180mm f/4.5 W-N", "Mamiya RB/RZ67", 180, 4.5),
  lens("mamiya-rz-250-4.5", "Mamiya", "Sekor Z 250mm f/4.5 W", "Mamiya RB/RZ67", 250, 4.5),

  // ---------------------------------------------------------------------------
  // Mamiya 645
  // ---------------------------------------------------------------------------
  lens("mamiya-645-35-3.5", "Mamiya", "Sekor C 35mm f/3.5 N", "Mamiya 645", 35, 3.5),
  lens("mamiya-645-45-2.8", "Mamiya", "Sekor C 45mm f/2.8 N", "Mamiya 645", 45, 2.8),
  lens("mamiya-645-55-2.8", "Mamiya", "Sekor C 55mm f/2.8 N", "Mamiya 645", 55, 2.8),
  lens("mamiya-645-80-1.9", "Mamiya", "Sekor C 80mm f/1.9 N", "Mamiya 645", 80, 1.9),
  lens("mamiya-645-80-2.8", "Mamiya", "Sekor C 80mm f/2.8 N", "Mamiya 645", 80, 2.8),
  lens("mamiya-645-110-2.8", "Mamiya", "Sekor C 110mm f/2.8 N", "Mamiya 645", 110, 2.8),
  lens("mamiya-645-150-3.5", "Mamiya", "Sekor C 150mm f/3.5 N", "Mamiya 645", 150, 3.5),
  lens("mamiya-645-210-4", "Mamiya", "Sekor C 210mm f/4 N", "Mamiya 645", 210, 4),

  // ---------------------------------------------------------------------------
  // Mamiya 7
  // ---------------------------------------------------------------------------
  lens("mamiya-7-43-4.5", "Mamiya", "N 43mm f/4.5 L", "Mamiya 7", 43, 4.5),
  lens("mamiya-7-50-4.5", "Mamiya", "N 50mm f/4.5", "Mamiya 7", 50, 4.5),
  lens("mamiya-7-65-4", "Mamiya", "N 65mm f/4 L", "Mamiya 7", 65, 4),
  lens("mamiya-7-80-4", "Mamiya", "N 80mm f/4 L", "Mamiya 7", 80, 4),
  lens("mamiya-7-150-4.5", "Mamiya", "N 150mm f/4.5 L", "Mamiya 7", 150, 4.5),

  // ---------------------------------------------------------------------------
  // Pentax 67
  // ---------------------------------------------------------------------------
  lens("pentax-67-45-4", "Pentax", "SMC 67 45mm f/4", "Pentax 67", 45, 4),
  lens("pentax-67-55-4", "Pentax", "SMC 67 55mm f/4", "Pentax 67", 55, 4),
  lens("pentax-67-75-2.8", "Pentax", "SMC 67 75mm f/2.8 AL", "Pentax 67", 75, 2.8),
  lens("pentax-67-90-2.8", "Pentax", "SMC 67 90mm f/2.8", "Pentax 67", 90, 2.8),
  lens("pentax-67-105-2.4", "Pentax", "SMC 67 105mm f/2.4", "Pentax 67", 105, 2.4),
  lens("pentax-67-150-2.8", "Pentax", "SMC 67 150mm f/2.8", "Pentax 67", 150, 2.8),
  lens("pentax-67-165-2.8", "Pentax", "SMC 67 165mm f/2.8", "Pentax 67", 165, 2.8),
  lens("pentax-67-200-4", "Pentax", "SMC 67 200mm f/4", "Pentax 67", 200, 4),

  // ---------------------------------------------------------------------------
  // Pentax 645
  // ---------------------------------------------------------------------------
  lens("pentax-645-35-3.5", "Pentax", "SMC Pentax-FA 645 35mm f/3.5 AL", "Pentax 645", 35, 3.5),
  lens("pentax-645-45-2.8", "Pentax", "SMC Pentax-A 645 45mm f/2.8", "Pentax 645", 45, 2.8),
  lens("pentax-645-75-2.8", "Pentax", "SMC Pentax-A 645 75mm f/2.8", "Pentax 645", 75, 2.8),
  lens("pentax-645-120-4-macro", "Pentax", "SMC Pentax-A 645 120mm f/4 Macro", "Pentax 645", 120, 4),
  lens("pentax-645-150-2.8", "Pentax", "SMC Pentax-A 645 150mm f/2.8", "Pentax 645", 150, 2.8),
  lens("pentax-645-200-4", "Pentax", "SMC Pentax-A 645 200mm f/4", "Pentax 645", 200, 4),

  // ---------------------------------------------------------------------------
  // M42 Universal
  // ---------------------------------------------------------------------------
  lens("m42-helios-44-2", "Helios", "44-2 58mm f/2", "M42", 58, 2),
  lens("m42-takumar-50-1.4", "Asahi", "Super Takumar 50mm f/1.4", "M42", 50, 1.4),
  lens("m42-takumar-55-1.8", "Asahi", "Super Takumar 55mm f/1.8", "M42", 55, 1.8),
  lens("m42-takumar-35-3.5", "Asahi", "Super Takumar 35mm f/3.5", "M42", 35, 3.5),
  lens("m42-takumar-28-3.5", "Asahi", "Super Takumar 28mm f/3.5", "M42", 28, 3.5),
  lens("m42-takumar-105-2.8", "Asahi", "Super Takumar 105mm f/2.8", "M42", 105, 2.8),
  lens("m42-takumar-135-3.5", "Asahi", "Super Takumar 135mm f/3.5", "M42", 135, 3.5),
  lens("m42-takumar-200-4", "Asahi", "Super Takumar 200mm f/4", "M42", 200, 4),
  lens("m42-flektogon-35-2.4", "Carl Zeiss Jena", "Flektogon 35mm f/2.4", "M42", 35, 2.4),
  lens("m42-pancolar-50-1.8", "Carl Zeiss Jena", "Pancolar 50mm f/1.8", "M42", 50, 1.8),
  lens("m42-biotar-58-2", "Carl Zeiss Jena", "Biotar 58mm f/2", "M42", 58, 2),
  lens("m42-sonnar-135-3.5", "Carl Zeiss Jena", "Sonnar 135mm f/3.5", "M42", 135, 3.5),
];

/** Populate the lensStock table with seed data (idempotent via bulkPut) */
export async function seedLensStocks(
  table: { bulkPut: (items: LensStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(lensStocks);
}
