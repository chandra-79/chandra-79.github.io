// Memory palace trainer data, all written for Ziggle: words, objects, names, made-up events,
// Major-system pegs and the Ziggle House route. Every word is concrete and easy to picture.

/** Ziggle House: a 30-spot walk from the front gate to the back garden. [room, spot, icon] */
export const ZIGGLE_HOUSE = Object.freeze([
  ['Front garden', 'Garden gate', '🚧'], ['Front garden', 'Mailbox', '📫'], ['Front garden', 'Flower bed', '🌷'], ['Front garden', 'Front step', '🪜'], ['Front garden', 'Front door', '🚪'],
  ['Hall', 'Doormat', '🟫'], ['Hall', 'Coat hooks', '🧥'], ['Hall', 'Hall mirror', '🪞'], ['Hall', 'Bottom stair', '🪜'],
  ['Living room', 'Sofa', '🛋️'], ['Living room', 'Fireplace', '🔥'], ['Living room', 'Bookshelf', '📚'], ['Living room', 'Floor lamp', '💡'], ['Living room', 'Window seat', '🪟'],
  ['Kitchen', 'Fridge', '🧊'], ['Kitchen', 'Sink', '🚰'], ['Kitchen', 'Oven', '♨️'], ['Kitchen', 'Kitchen table', '🍽️'], ['Kitchen', 'Cookie jar', '🍪'],
  ['Bathroom', 'Bathtub', '🛁'], ['Bathroom', 'Towel rail', '🧺'], ['Bathroom', 'Toothbrush cup', '🪥'],
  ['Bedroom', 'Bed', '🛏️'], ['Bedroom', 'Wardrobe', '👗'], ['Bedroom', 'Desk', '✏️'], ['Bedroom', 'Bedroom window', '🌙'],
  ['Back garden', 'Swing', '🌳'], ['Back garden', 'Pond', '🐸'], ['Back garden', 'Garden shed', '🛖'], ['Back garden', 'Bird table', '🐦'],
]);

/** Objects for linking stories: [emoji, name]. */
export const OBJECTS = Object.freeze([
  ['🎈', 'balloon'], ['🍌', 'banana'], ['🔑', 'key'], ['☂️', 'umbrella'], ['🎸', 'guitar'], ['🧦', 'socks'], ['🍕', 'pizza'], ['🚲', 'bicycle'], ['📚', 'books'], ['🕯️', 'candle'],
  ['🧲', 'magnet'], ['🎩', 'top hat'], ['🪁', 'kite'], ['🐢', 'turtle'], ['🌵', 'cactus'], ['🍩', 'doughnut'], ['⏰', 'alarm clock'], ['🧸', 'teddy bear'], ['🚀', 'rocket'], ['🎺', 'trumpet'],
  ['🥕', 'carrot'], ['🍉', 'watermelon'], ['🦆', 'duck'], ['🧀', 'cheese'], ['🔔', 'bell'], ['🎲', 'dice'], ['🪑', 'chair'], ['🛁', 'bathtub'], ['🧹', 'broom'], ['🎁', 'gift'],
  ['📷', 'camera'], ['🪣', 'bucket'], ['🧤', 'gloves'], ['👑', 'crown'], ['🦒', 'giraffe'], ['🐙', 'octopus'], ['🍦', 'ice cream'], ['🚂', 'train'], ['⚓', 'anchor'], ['🏀', 'basketball'],
  ['🎻', 'violin'], ['🌋', 'volcano'], ['🍄', 'mushroom'], ['🐝', 'bee'], ['🦀', 'crab'], ['🥨', 'pretzel'], ['🛶', 'canoe'], ['🪴', 'pot plant'], ['🧩', 'jigsaw piece'], ['🔦', 'torch'],
  ['🧁', 'cupcake'], ['🐘', 'elephant'], ['🎃', 'pumpkin'], ['🍍', 'pineapple'], ['🦉', 'owl'], ['🛼', 'roller skate'], ['🪀', 'yo-yo'], ['🎀', 'ribbon'], ['🦔', 'hedgehog'], ['🧭', 'compass'],
]);

/** Concrete words for palace lists. Short, picturable and friendly for every age. */
export const WORDS = Object.freeze(`apple anchor ant apron arrow axe badge bagel balloon banana bandage banjo barrel basket bat beach bean beard bed bee bell belt bench bicycle blanket boat bone boot bottle bowl box bracelet bread brick bridge broom brush bubble bucket bug bus butter button cabbage cactus cake camel camera candle canoe cap car carpet carrot castle cat chain chair chalk cheese cherry chicken chimney clock cloud coat coconut coin comb compass cookie corn cow crab crayon crown cup curtain cushion daisy desk diamond dice dinosaur dog doll dolphin donkey door dragon drum duck eagle egg elephant envelope eraser feather fence fern fire fish flag flame flute fork fountain fox frog garden ghost giraffe glass globe glove goat goose grape guitar hammer hammock harp hat helmet hippo honey hook horse hose igloo iron island jacket jam jar jelly jewel kettle key kite kitten knot ladder ladle lamp lantern leaf lemon letter lighthouse lion lizard lobster lock magnet mango map marble mask medal melon mermaid mirror mitten monkey moon moose mop mouse mug mushroom nail necklace nest net noodle notebook nut oar octopus orange owl paddle pancake panda parachute parrot peach peanut pear pebble pen pencil penguin pepper piano pickle pie pig pillow pineapple pirate pizza planet plate pocket pony popcorn potato puddle pumpkin puppet puppy quilt rabbit raccoon radio rainbow rake rocket rope rose ruler sail sandal sandwich saucer scarf scissors seal shark sheep shell shovel skate skunk sled slipper snail snake snowman sock sofa spider spoon squirrel stamp star statue stool strawberry submarine suitcase sun swan sweater swing sword table tent tiger toast tomato toothbrush torch tortoise towel tractor train tree trophy truck trumpet tulip turtle umbrella unicorn vase violin volcano wagon walrus wand watch waterfall whale wheel whistle window wizard wolf yacht yo-yo zebra zipper`.split(' '));

/** First and family names from many places, for Names and Faces. */
export const FIRST_NAMES = Object.freeze(`Ada Aiko Amara Anil Ava Bea Bodhi Carmen Chen Dara Diego Elif Emeka Esme Farah Felix Freya Gita Hana Hugo Ines Isaac Ivy Jada Jonas Kai Kemal Kiri Lana Leo Lila Luca Maya Mateo Mei Mila Nadia Nico Noor Obi Olga Omar Pia Priya Quinn Rafa Rana Rosa Rumi Sami Sana Sofia Tariq Tess Theo Uma Uri Vera Vik Wren Xia Yara Yusuf Zane Zara Zoe Ravi Lars Ines Malik Nell Oscar Pablo Rhea Sol Tomas`.split(' ').filter((name, i, list) => list.indexOf(name) === i));
export const LAST_NAMES = Object.freeze(`Abara Adler Banks Barros Bello Brandt Castro Chowdhury Costa Dahl Diaz Duval Ekström Elliott Ferreira Fischer Garcia Gill Haddad Hale Hoshino Ibsen Iyer Jensen Joshi Kato Keller Khan Kim Kowalski Lambert Larsen Lopez Mahler Mensah Moreau Nakamura Navarro Novak Nwosu Okafor Olsen Ortiz Park Patel Perez Quinlan Rahman Reyes Rossi Santos Sato Schmidt Silva Singh Sokolov Tanaka Torres Ueda Vance Varga Wagner Walsh Weber Xu Yilmaz Young Zeller Zhang`.split(' '));

/** Made-up historical events, in the spirit of the memory championships' fictional dates. */
export const EVENTS = Object.freeze([
  'A penguin opens a bakery', 'The first sock with three toes is knitted', 'A town paints every door yellow', 'Giraffes learn to tap dance', 'The moon gets its own postcode',
  'A pirate returns all the treasure', 'Pancakes are declared a national flag', 'A dragon wins a spelling bee', 'The world’s longest sandwich is eaten by ants', 'A clock starts running backwards',
  'Snowmen go on strike', 'A cat is elected harbour master', 'The first bicycle built for twelve', 'A lighthouse falls in love with a ship', 'Dolphins publish a newspaper',
  'A volcano erupts with popcorn', 'Every umbrella in the city turns inside out', 'A king trades his crown for a kite', 'A library lends out thunderstorms', 'Tortoises win a relay race',
  'A wizard forgets his own name', 'Bees invent a new dance', 'A balloon carries a piano across the sea', 'The first underwater orchestra plays', 'A rainbow appears at midnight',
  'Robots learn to knit scarves', 'A village swaps its church bell for a gong', 'A goat climbs the tallest tower', 'Owls open a night school', 'A cheese wheel rolls into the history books',
  'The first hot-air balloon race to the moon', 'A frog becomes a famous opera singer', 'An island floats away for a week', 'The first ice cream that never melts', 'A queen hides the crown in a cookie jar',
  'Mice build a bridge of spaghetti', 'A comet lands in a garden pond', 'Elephants learn to paint portraits', 'A train runs on lemonade', 'The first snowball fight in the desert',
  'A whale sings the national anthem', 'Kites are banned on Tuesdays', 'A lion opens a hairdresser’s', 'The first map of the bottom of the sea', 'A teapot is crowned mayor',
  'Squirrels hide the town’s keys', 'A rocket is launched from a bathtub', 'The great button shortage begins', 'A puppet becomes a detective', 'Seagulls form a choir',
  'A castle is built entirely of books', 'The first parade of walking trees', 'A tiger learns to whistle', 'Every bell in town rings at once', 'A snail wins the marathon',
  'A cloud is caught in a jar', 'Pigs take up sailing', 'The first garden on a rooftop bus', 'A shark becomes a dentist', 'Hedgehogs knit the longest scarf',
]);

/**
 * Ziggle's Major-system pegs, 00–99. Each word's consonant sounds spell its number
 * (s z = 0, t d th = 1, n = 2, m = 3, r = 4, l = 5, j sh ch soft g = 6, k hard c g ck = 7, f v ph = 8, p b = 9).
 */
export const PEGS = Object.freeze(`sauce seed sun sumo sari seal sash sock sofa soap toes tide tuna dome tire tail dish duck dove tuba nose net onion gnome nori nail nacho neck knife knob mouse mat moon mummy mower mule mash mug movie map rose rat rain ram rower roll arch rock roof rope lace lid lion lime lyre lily leash log leaf lip cheese sheet chain jam cherry jelly choo-choo chick chef ship case cat can comb car coal cage cake cave cap vase foot fan foam fire file fish fog fife fob bus bat bone puma bear bell bush book beehive pipe`.split(' '));

/** The Major sounds, for the lesson screen. */
export const MAJOR_SOUNDS = Object.freeze([
  ['0', 's, z', 'z is the first sound of zero'], ['1', 't, d, th', 't has one downstroke'], ['2', 'n', 'n has two downstrokes'], ['3', 'm', 'm has three'],
  ['4', 'r', 'four ends in r'], ['5', 'l', 'L is the Roman 50'], ['6', 'j, sh, ch, soft g', 'a j looks like a backwards 6'], ['7', 'k, hard c, hard g', 'two 7s make a K'],
  ['8', 'f, v', 'a handwritten f has two loops, like 8'], ['9', 'p, b', 'p is a mirrored 9'],
]);
