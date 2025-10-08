import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const tips = [
  "Craft a shield early—right-click to block arrows and creeper splash.",
  "Carry a water bucket to stop fall damage and cross lava safely.",
  "Place torches every ~5 blocks in caves to prevent mob spawns.",
  "Use a boat to move villagers safely—even across land.",
  "Silk Touch keeps ore blocks; use Fortune later for more drops.",
  "Trapdoors let you crawl through 1-block spaces—sneaky tunnels!",
  "Compost extra seeds to make bone meal for crops and trees.",
  "Name tags stop pets and mobs from despawning.",
  "Keep a spare pickaxe; F3+H shows durability numbers.",
  "Bottom slabs stop mob spawns—great for floors and paths.",
  "Right-click with bone meal on grass to grow flowers instantly.",
  "Campfires cook food slowly but never burn it—safe AFK cooking!",
  "Use honey bottles to cure poison effects quickly.",
  "Scaffolding is faster than pillaring—place and climb easily.",
  "Fence gates connect to walls but regular fences don't.",
  "Use leads to tie mobs to fence posts safely.",
  "Crouch while placing blocks to avoid falling off edges.",
  "Iron doors need redstone; wooden doors just need right-click.",
  "Use maps to mark your base location before exploring far.",
  "Beds set your spawn point—always sleep safely at home.",
  "Use minecarts on powered rails for fast long-distance travel.",
  "Stone tools last longer than wood—upgrade quickly!",
  "Cook raw fish and meat for more hunger and saturation.",
  "Use signs to label chests and remember what's inside.",
  "Dig stairs down instead of straight holes to avoid falling.",
  "Use buckets to move lava for traps or obsidian making.",
  "Enchanted golden apples give the best healing effects.",
  "Use hoppers to automatically sort items into chests.",
  "Build walls around your base to keep monsters out.",
  "Use compasses to find your way back to spawn point.",
  "Store extra tools in ender chests for safe keeping.",
  "Use fishing rods to catch food and sometimes treasure!",
  "Plant trees in a square pattern for easy wood harvesting.",
  "Use glass blocks underwater to create air pockets for breathing."
];

export async function GET() {
  // Get London date deterministically
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const [{value: day}, , {value: month}, , {value: year}] = fmt.formatToParts(new Date());
  const ymd = `${year}-${month}-${day}`;
  
  // Deterministic tip selection based on date
  const idx = Number(ymd.replaceAll("-", "")) % tips.length;
  const tip = tips[idx];
  
  const res = NextResponse.json({ tip, ymd });
  res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return res;
}