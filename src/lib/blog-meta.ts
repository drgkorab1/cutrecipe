export const POST_IMAGES: Record<string, string> = {
  'how-to-make-sourdough-bread':
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  'perfect-chocolate-chip-cookies':
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
  'season-cast-iron-skillet':
    'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
  'knife-skills-101':
    'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&w=800&q=80',
  'beginners-guide-to-meal-prep':
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  'everything-about-olive-oil':
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  'classic-french-onion-soup':
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
  'homemade-pasta-from-scratch':
    'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80',
  'science-of-emulsification':
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  'cook-dried-beans-perfectly':
    'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=80',
  'braising-the-most-forgiving-cooking-method':
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  'how-to-stock-a-pantry-from-scratch':
    'https://images.unsplash.com/photo-1556909114-44e3e70034e2?auto=format&fit=crop&w=800&q=80',
  'complete-guide-to-cooking-with-herbs':
    'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=800&q=80',
  'how-to-make-proper-beef-stock':
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  'scrambled-eggs-the-technique-that-changes-everything':
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
  'how-to-reduce-food-waste-in-your-kitchen':
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
  'understanding-cooking-heat':
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=800&q=80',
  'the-right-way-to-rest-meat-after-cooking':
    'https://images.unsplash.com/photo-1690983329845-638ec321647d?auto=format&fit=crop&w=800&q=80',
  'how-to-taste-your-food-while-you-cook':
    'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&w=800&q=80',
  'nine-dinners-from-one-roast-chicken':
    'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=800&q=80',
}

export interface AuthorBio {
  specialty: string
  bio: string
}

export const AUTHOR_BIOS: Record<string, AuthorBio> = {
  'Emma Hartley': {
    specialty: 'Baking & Pastry',
    bio: 'Former pastry chef turned food writer, Emma spent eight years in professional kitchens in London before pivoting to writing about the science and joy of everyday cooking. She believes the best food is always simpler than you think.',
  },
  'Marcus Chen': {
    specialty: 'Food Science & Fermentation',
    bio: 'Food scientist and self-taught cook based in Singapore. Marcus applies a rigorous, evidence-based approach to cooking and has a particular obsession with emulsification and fermentation. He tests every technique at least a dozen times before writing about it.',
  },
  'Sofia Reyes': {
    specialty: 'Mexican Cuisine & Technique',
    bio: 'Mexican-American chef and culinary educator based in Mexico City. Sofia grew up cooking alongside her grandmother and now teaches traditional techniques alongside modern adaptations. She writes about flavour, intuition, and the culture behind food.',
  },
  "James O'Brien": {
    specialty: 'Classical French Cooking',
    bio: 'Irish chef and food journalist who spent a decade cooking in Michelin-starred restaurants in Paris and Dublin. James now writes about traditional techniques and the often-overlooked wisdom of classical cooking.',
  },
  'Priya Nair': {
    specialty: 'Sustainability & Indian Cooking',
    bio: 'Food sustainability advocate and cookbook author based in Bangalore. Priya writes about reducing waste, seasonal eating, and the intersection of traditional Indian cooking with modern sustainability practices.',
  },
  'Tom Willoughby': {
    specialty: 'Classical Stocks & Sauces',
    bio: 'Former restaurant chef and food historian with a focus on classical European cooking. Tom believes that understanding where techniques come from makes you a better cook, and he brings the same rigour to home cooking that he brought to professional kitchens.',
  },
  'Aisha Koroma': {
    specialty: 'Practical Home Cooking',
    bio: 'West African–British cook and food writer based in London. Aisha writes about building a practical, well-stocked kitchen and making everyday cooking feel effortless. Her approach is unfussy and deeply practical.',
  },
  'Lena Fischer': {
    specialty: 'Bread & Fermentation',
    bio: 'German-born baker and food writer who trained in Vienna and now lives in Copenhagen. Lena is fascinated by fermentation, whole-grain baking, and the way bread connects communities across cultures.',
  },
  'David Park': {
    specialty: 'Heat Control & Technique',
    bio: 'Korean-American chef and culinary instructor based in Seoul and New York. David teaches fundamental techniques and has a particular passion for heat control and the physics of cooking.',
  },
  'Clara Morin': {
    specialty: 'Herbs & Provençal Cuisine',
    bio: 'French food writer and herb gardener based in Provence. Clara has spent twenty years growing and cooking with herbs, and she writes with the authority of someone who has tried every combination imaginable.',
  },
}
