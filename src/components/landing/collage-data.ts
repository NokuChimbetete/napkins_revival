export type CollageTile = {
  src: string;
  alt: string;
  flex: number;
};

export const STRIP_TILES: CollageTile[] = [
  { src: "/assets/vintage-06.jpg", alt: "Vintage cover: West, July 5th", flex: 0.8 },
  { src: "/assets/vintage-19.jpg", alt: "Vintage cover: Child Life, January 1928", flex: 0.97 },
  { src: "/assets/vintage-10.jpg", alt: "Vintage cover: Judge — in the movies", flex: 0.86 },
  { src: "/assets/vintage-16.jpg", alt: "Vintage cover: Popular Electronics, October 1954", flex: 1.14 },
  { src: "/assets/vintage-02.jpg", alt: "Vintage cover: Ghost Stories", flex: 0.99 },
  { src: "/assets/vintage-22.jpg", alt: "Vintage cover: The American Home, June 1930", flex: 0.94 },
  { src: "/assets/vintage-12.jpg", alt: "Vintage cover: The Photodramatist, September 1921", flex: 1.21 },
  { src: "/assets/vintage-27.jpg", alt: "Vintage cover: Judge — Christmas Number", flex: 0.95 },
  { src: "/assets/vintage-08.jpg", alt: "Vintage cover: Electronics Illustrated", flex: 1.26 },
  { src: "/assets/vintage-04.jpg", alt: "Vintage cover: The National Police Gazette, 1922", flex: 1.09 },
  { src: "/assets/vintage-23.jpg", alt: "Vintage cover: The Wrestler, August 1988", flex: 0.89 },
  { src: "/assets/vintage-03.jpg", alt: "Vintage cover: Radio Age, January 1924", flex: 1.03 },
  { src: "/assets/vintage-17.jpg", alt: "Vintage cover: Judge — Boy Wanted", flex: 1.1 },
  { src: "/assets/vintage-24.jpg", alt: "Vintage cover: The Architect and Engineer", flex: 1.01 },
];

export const WALL_ROWS: { height: number; tiles: CollageTile[] }[] = [
  {
    height: 238,
    tiles: [
      { src: "/assets/vintage-03.jpg", alt: "Vintage cover: Radio Age, January 1924", flex: 1.11 },
      { src: "/assets/vintage-14.jpg", alt: "Vintage cover: Forest and Stream", flex: 0.94 },
      { src: "/assets/vintage-09.jpg", alt: "Vintage cover: Judge — Bride's Number", flex: 1.08 },
      { src: "/assets/vintage-23.jpg", alt: "Vintage cover: The Wrestler, August 1988", flex: 1.32 },
      { src: "/assets/vintage-02.jpg", alt: "Vintage cover: Ghost Stories", flex: 1.15 },
      { src: "/assets/vintage-22.jpg", alt: "Vintage cover: The American Home, June 1930", flex: 1.07 },
      { src: "/assets/vintage-10.jpg", alt: "Vintage cover: Judge — in the movies", flex: 1.26 },
      { src: "/assets/vintage-26.jpg", alt: "Vintage cover: Space Science Fiction", flex: 1.28 },
      { src: "/assets/vintage-15.jpg", alt: "Vintage cover: Judge, January 1922", flex: 0.82 },
    ],
  },
  {
    height: 252,
    tiles: [
      { src: "/assets/vintage-21.jpg", alt: "Vintage cover: Electrician & Mechanic, February 1913", flex: 1.33 },
      { src: "/assets/vintage-01.jpg", alt: "Vintage cover: Popular Science — parachute", flex: 0.9 },
      { src: "/assets/vintage-05.jpg", alt: "Vintage cover: Judge, December 1922", flex: 0.89 },
      { src: "/assets/vintage-18.jpg", alt: "Vintage cover: Popular Science — shipyard", flex: 1.33 },
      { src: "/assets/vintage-04.jpg", alt: "Vintage cover: The National Police Gazette, 1922", flex: 0.81 },
      { src: "/assets/vintage-27.jpg", alt: "Vintage cover: Judge — Christmas Number", flex: 0.99 },
      { src: "/assets/vintage-07.jpg", alt: "Vintage cover: Popular Science — passenger airplane", flex: 0.8 },
      { src: "/assets/vintage-20.jpg", alt: "Vintage cover: Judge — Christmas stamps", flex: 0.82 },
      { src: "/assets/vintage-06.jpg", alt: "Vintage cover: West, July 5th", flex: 1.15 },
    ],
  },
  {
    height: 256,
    tiles: [
      { src: "/assets/vintage-13.jpg", alt: "Vintage magazine cover", flex: 1.18 },
      { src: "/assets/vintage-08.jpg", alt: "Vintage cover: Electronics Illustrated", flex: 0.9 },
      { src: "/assets/vintage-25.jpg", alt: "Vintage magazine cover", flex: 1.3 },
      { src: "/assets/vintage-17.jpg", alt: "Vintage cover: Judge — Boy Wanted", flex: 0.85 },
      { src: "/assets/vintage-11.jpg", alt: "Vintage magazine cover", flex: 1.05 },
      { src: "/assets/vintage-19.jpg", alt: "Vintage cover: Child Life, January 1928", flex: 0.95 },
      { src: "/assets/vintage-16.jpg", alt: "Vintage cover: Popular Electronics, October 1954", flex: 1.22 },
      { src: "/assets/vintage-24.jpg", alt: "Vintage cover: The Architect and Engineer", flex: 0.88 },
      { src: "/assets/vintage-12.jpg", alt: "Vintage cover: The Photodramatist, September 1921", flex: 1.1 },
    ],
  },
];
