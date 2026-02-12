export interface HSNItem {
    code: string;
    name: string;
    rate: number; // Standard rate, can vary by state/price, providing most common
    category: string;
    chapter: string;
}

// Categories mapped to Chapters for filtering
export const HSN_SECTION_CATEGORIES = {
    "Animals & Meat": ["01", "02", "03", "04", "05"],
    "Plants & Vegetables": ["06", "07", "08", "09", "10", "11", "12", "13", "14"],
    "Oil & Fat": ["15"],
    "Food & Beverages": ["16", "17", "18", "19", "20", "21", "22", "23", "24"],
    "Minerals & Chemicals": ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"],
    "Plastics & Rubber": ["39", "40"],
    "Leather & Travel": ["41", "42", "43"],
    "Wood & Paper": ["44", "45", "46", "47", "48", "49"],
    "Textiles": ["50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63"],
    "Footwear & Headgear": ["64", "65", "66", "67"],
    "Stone & Glass": ["68", "69", "70"],
    "Metals": ["71", "72", "73", "74", "75", "76", "78", "79", "80", "81", "82", "83"],
    "Electronics & Machinery": ["84", "85"],
    "Vehicles": ["86", "87", "88", "89"],
    "Instruments & Clocks": ["90", "91", "92"],
    "Arms": ["93"],
    "Furniture & Lights": ["94", "95", "96"],
    "Art": ["97", "98"],
    "Services": ["99"]
};

export const HSN_CATEGORIES = [
    "All",
    ...Object.keys(HSN_SECTION_CATEGORIES)
];

export const hsnMasterData: HSNItem[] = [
    // Chapter 01: Live Animals
    { code: "0101", name: "Live Horses, Asses, Mules and Hinnies", rate: 12, category: "Animals & Meat", chapter: "01" },
    { code: "0102", name: "Live Bovine Animals (Cows, Buffaloes)", rate: 0, category: "Animals & Meat", chapter: "01" },
    { code: "0103", name: "Live Swine", rate: 0, category: "Animals & Meat", chapter: "01" },
    { code: "0104", name: "Live Sheep and Goats", rate: 0, category: "Animals & Meat", chapter: "01" },
    { code: "0105", name: "Live Poultry (Fowls, Ducks, Geese, Turkeys)", rate: 0, category: "Animals & Meat", chapter: "01" },

    // Chapter 02: Meat
    { code: "0201", name: "Meat of Bovine Animals, Fresh or Chilled", rate: 0, category: "Animals & Meat", chapter: "02" },
    { code: "0202", name: "Meat of Bovine Animals, Frozen", rate: 0, category: "Animals & Meat", chapter: "02" },
    { code: "0203", name: "Meat of Swine, Fresh, Chilled or Frozen", rate: 0, category: "Animals & Meat", chapter: "02" },
    { code: "0207", name: "Meat of Poultry, Fresh, Chilled or Frozen", rate: 0, category: "Animals & Meat", chapter: "02" },

    // Chapter 03: Fish
    { code: "0301", name: "Live Fish", rate: 0, category: "Animals & Meat", chapter: "03" },
    { code: "0302", name: "Fish, Fresh or Chilled", rate: 0, category: "Animals & Meat", chapter: "03" },
    { code: "0306", name: "Crustaceans (Crabs, Shrimps, Prawns)", rate: 5, category: "Animals & Meat", chapter: "03" },

    // Chapter 04: Dairy
    { code: "0401", name: "Milk and Cream, not concentrated", rate: 0, category: "Animals & Meat", chapter: "04" },
    { code: "0402", name: "Milk and Cream, concentrated (Milk Powder)", rate: 5, category: "Animals & Meat", chapter: "04" },
    { code: "0403", name: "Yogurt, Buttermilk, Curd", rate: 5, category: "Animals & Meat", chapter: "04" }, // Branded 5%, unbranded 0%
    { code: "0405", name: "Butter and Ghee", rate: 12, category: "Animals & Meat", chapter: "04" },
    { code: "0406", name: "Cheese and Curd", rate: 12, category: "Animals & Meat", chapter: "04" },
    { code: "0407", name: "Birds' Eggs, in shell, fresh", rate: 0, category: "Animals & Meat", chapter: "04" },
    { code: "0409", name: "Natural Honey", rate: 5, category: "Animals & Meat", chapter: "04" }, // Branded 5%

    // Chapter 05: Animal Origin Products
    { code: "0504", name: "Guts, Bladders and Stomachs of Animals", rate: 5, category: "Animals & Meat", chapter: "05" },

    // Chapter 06: Live Trees & Plants
    { code: "0601", name: "Bulbs, Tubers, Corms", rate: 0, category: "Plants & Vegetables", chapter: "06" },
    { code: "0603", name: "Cut Flowers and Flower Buds", rate: 0, category: "Plants & Vegetables", chapter: "06" },

    // Chapter 07: Vegetables
    { code: "0701", name: "Potatoes, fresh or chilled", rate: 0, category: "Plants & Vegetables", chapter: "07" },
    { code: "0702", name: "Tomatoes, fresh or chilled", rate: 0, category: "Plants & Vegetables", chapter: "07" },
    { code: "0703", name: "Onions, Shallots, Garlic, Leeks", rate: 0, category: "Plants & Vegetables", chapter: "07" },
    { code: "0704", name: "Cabbages, Cauliflowers", rate: 0, category: "Plants & Vegetables", chapter: "07" },
    { code: "0710", name: "Vegetables (Frozen)", rate: 5, category: "Plants & Vegetables", chapter: "07" }, // Brand 5%
    { code: "0713", name: "Dried Leguminous Vegetables (Dal, Pulses)", rate: 5, category: "Plants & Vegetables", chapter: "07" }, // Branded 5%

    // Chapter 08: Fruits
    { code: "0801", name: "Coconuts, Brazil Nuts, Cashew Nuts", rate: 5, category: "Plants & Vegetables", chapter: "08" }, // Dried 5%, Fresh 0%
    { code: "0803", name: "Bananas, including plantains", rate: 0, category: "Plants & Vegetables", chapter: "08" }, // Fresh
    { code: "0804", name: "Dates, Figs, Pineapples, Avocados", rate: 0, category: "Plants & Vegetables", chapter: "08" },
    { code: "0805", name: "Citrus Fruit (Oranges, Lemons)", rate: 0, category: "Plants & Vegetables", chapter: "08" },
    { code: "0806", name: "Grapes, fresh or dried", rate: 0, category: "Plants & Vegetables", chapter: "08" }, // Dried 5%?
    { code: "0810", name: "Strawberries, Raspberries", rate: 0, category: "Plants & Vegetables", chapter: "08" },

    // Chapter 09: Coffee, Tea, Spices
    { code: "0901", name: "Coffee, roasted or not", rate: 5, category: "Plants & Vegetables", chapter: "09" },
    { code: "0902", name: "Tea, whether or not flavored", rate: 5, category: "Plants & Vegetables", chapter: "09" },
    { code: "0904", name: "Pepper, Genus Piper", rate: 5, category: "Plants & Vegetables", chapter: "09" },
    { code: "0910", name: "Ginger, Saffron, Turmeric, Thyme", rate: 5, category: "Plants & Vegetables", chapter: "09" },

    // Chapter 10: Cereals
    { code: "1001", name: "Wheat and Meslin", rate: 0, category: "Plants & Vegetables", chapter: "10" }, // Branded 5%
    { code: "1006", name: "Rice", rate: 0, category: "Plants & Vegetables", chapter: "10" }, // Branded 5%
    { code: "1005", name: "Maize (Corn)", rate: 0, category: "Plants & Vegetables", chapter: "10" },

    // Chapter 11: Products of Milling Industry
    { code: "1101", name: "Wheat Flour (Atta, Maida)", rate: 0, category: "Plants & Vegetables", chapter: "11" }, // Branded 5%
    { code: "1103", name: "Cereal Groats, Meal (Suji)", rate: 0, category: "Plants & Vegetables", chapter: "11" }, // Branded 5%

    // Chapter 12: Oil Seeds
    { code: "1201", name: "Soya Beans", rate: 5, category: "Plants & Vegetables", chapter: "12" },
    { code: "1202", name: "Groundnuts (Peanuts)", rate: 5, category: "Plants & Vegetables", chapter: "12" },

    // Chapter 13: Lac, Gums, Resins
    { code: "1301", name: "Lac, Natural Gums, Resins", rate: 5, category: "Plants & Vegetables", chapter: "13" },

    // Chapter 14: Vegetable Plaiting Materials
    { code: "1401", name: "Bamboos, Rattans", rate: 5, category: "Plants & Vegetables", chapter: "14" },

    // Chapter 15: Animal/Veg Fats & Oils
    { code: "1507", name: "Soya-bean Oil", rate: 5, category: "Oil & Fat", chapter: "15" },
    { code: "1508", name: "Ground-nut Oil", rate: 5, category: "Oil & Fat", chapter: "15" },
    { code: "1509", name: "Olive Oil", rate: 5, category: "Oil & Fat", chapter: "15" },
    { code: "1511", name: "Palm Oil", rate: 5, category: "Oil & Fat", chapter: "15" },
    { code: "1512", name: "Sunflower Oil", rate: 5, category: "Oil & Fat", chapter: "15" },
    { code: "1516", name: "Animal/Veg Fats (Hydrogenated) - Vanaspati", rate: 12, category: "Oil & Fat", chapter: "15" }, // Edible grade 5%?

    // Chapter 16: Preparations of Meat/Fish
    { code: "1601", name: "Sausages", rate: 12, category: "Food & Beverages", chapter: "16" },

    // Chapter 17: Sugars
    { code: "1701", name: "Cane or Beet Sugar (White Sugar)", rate: 5, category: "Food & Beverages", chapter: "17" },
    { code: "1702", name: "Other Sugars (Glucose, Fructose)", rate: 18, category: "Food & Beverages", chapter: "17" },
    { code: "1704", name: "Sugar Confectionery (Non-Cocoa)", rate: 18, category: "Food & Beverages", chapter: "17" },

    // Chapter 18: Cocoa
    { code: "1806", name: "Chocolate and Cocoa Food Preparations", rate: 18, category: "Food & Beverages", chapter: "18" },

    // Chapter 19: Cereal Preparations
    { code: "1901", name: "Malt Extract, Baby Food", rate: 18, category: "Food & Beverages", chapter: "19" },
    { code: "1902", name: "Pasta, Noodles, Couscous", rate: 12, category: "Food & Beverages", chapter: "19" }, // Instant 18%?
    { code: "1904", name: "Corn Flakes, Breakfast Cereals", rate: 18, category: "Food & Beverages", chapter: "19" },
    { code: "1905", name: "Bread, Pastry, Cakes, Biscuits", rate: 18, category: "Food & Beverages", chapter: "19" }, // Bread/Rusk 0/5%, Biscuits 18%

    // Chapter 20: Veg/Fruit Preparations
    { code: "2001", name: "Pickles (Vinegar preserved)", rate: 12, category: "Food & Beverages", chapter: "20" },
    { code: "2007", name: "Jams, Fruit Jellies, Marmalades", rate: 12, category: "Food & Beverages", chapter: "20" },
    { code: "2009", name: "Fruit Juices", rate: 12, category: "Food & Beverages", chapter: "20" },

    // Chapter 21: Misc Edible Preparations
    { code: "2101", name: "Extracts of Coffee/Tea (Instant Coffee)", rate: 18, category: "Food & Beverages", chapter: "21" },
    { code: "2103", name: "Sauces, Mixed Condiments (Ketchup)", rate: 12, category: "Food & Beverages", chapter: "21" },
    { code: "2105", name: "Ice Cream", rate: 18, category: "Food & Beverages", chapter: "21" },
    { code: "2106", name: "Food Preparations NES (Namkeen, Snacks)", rate: 12, category: "Food & Beverages", chapter: "21" },

    // Chapter 22: Beverages
    { code: "2201", name: "Water (Mineral/Aerated)", rate: 18, category: "Food & Beverages", chapter: "22" },
    { code: "2202", name: "Soft Drinks (Sweetened/Flavored)", rate: 28, category: "Food & Beverages", chapter: "22" }, // + Cess

    // Chapter 24: Tobacco
    { code: "2402", name: "Cigars, Cigarettes", rate: 28, category: "Food & Beverages", chapter: "24" }, // + Cess

    // Chapter 25: Salt, Sulfur, Earths, Stone
    { code: "2501", name: "Salt", rate: 0, category: "Minerals & Chemicals", chapter: "25" },
    { code: "2523", name: "Portland Cement", rate: 28, category: "Minerals & Chemicals", chapter: "25" },
    { code: "2515", name: "Marble and Travertine Blocks", rate: 18, category: "Minerals & Chemicals", chapter: "25" },

    // Chapter 27: Mineral Fuels
    { code: "2710", name: "Petroleum Oils (Petrol, Diesel)", rate: 0, category: "Minerals & Chemicals", chapter: "27" }, // Non-GST usually
    { code: "2711", name: "Petroleum Gases (LPG)", rate: 5, category: "Minerals & Chemicals", chapter: "27" }, // Domestic 5%

    // Chapter 30: Pharmaceutical
    { code: "3004", name: "Medicaments (Tablets, Capsules)", rate: 12, category: "Minerals & Chemicals", chapter: "30" },
    { code: "3006", name: "Pharmaceutical Goods (First Aid Kits)", rate: 12, category: "Minerals & Chemicals", chapter: "30" },

    // Chapter 31: Fertilizers
    { code: "3102", name: "Nitrogenous Fertilizers (Urea)", rate: 5, category: "Minerals & Chemicals", chapter: "31" },

    // Chapter 32: Tanning/Dyeing
    { code: "3208", name: "Paints and Varnishes (Acrylic, Vinyl)", rate: 18, category: "Minerals & Chemicals", chapter: "32" },
    { code: "3209", name: "Paints (Water based - Emulsion)", rate: 18, category: "Minerals & Chemicals", chapter: "32" },
    { code: "3215", name: "Printing Ink, Writing Ink", rate: 18, category: "Minerals & Chemicals", chapter: "32" },

    // Chapter 33: Essential Oils / Cosmetics
    { code: "3303", name: "Perfumes and Toilet Waters", rate: 18, category: "Minerals & Chemicals", chapter: "33" },
    { code: "3304", name: "Beauty/Make-up Prep (Skincare)", rate: 18, category: "Minerals & Chemicals", chapter: "33" },
    { code: "3305", name: "Hair Preparations (Shampoo, Oil)", rate: 18, category: "Minerals & Chemicals", chapter: "33" },
    { code: "3306", name: "Oral Hygiene (Toothpaste)", rate: 18, category: "Minerals & Chemicals", chapter: "33" },
    { code: "3307", name: "Shaving Prep, Deodorants", rate: 18, category: "Minerals & Chemicals", chapter: "33" },

    // Chapter 34: Soap
    { code: "3401", name: "Soap, Organic Surface-active products", rate: 18, category: "Minerals & Chemicals", chapter: "34" },
    { code: "3402", name: "Detergents, Washing Powder", rate: 18, category: "Minerals & Chemicals", chapter: "34" },

    // Chapter 39: Plastics
    { code: "3917", name: "Tubes, Pipes, Hoses (PVC)", rate: 18, category: "Plastics & Rubber", chapter: "39" },
    { code: "3923", name: "Plastic Packing Goods (Bottles, Bags)", rate: 18, category: "Plastics & Rubber", chapter: "39" },
    { code: "3924", name: "Tableware, Kitchenware of Plastics", rate: 18, category: "Plastics & Rubber", chapter: "39" },
    { code: "3926", name: "Other articles of Plastics (Bangles)", rate: 0, category: "Plastics & Rubber", chapter: "39" }, // PVC Belt 18%

    // Chapter 40: Rubber
    { code: "4011", name: "New Pneumatic Tyres", rate: 28, category: "Plastics & Rubber", chapter: "40" },
    { code: "4016", name: "Articles of Vulcanized Rubber (Erasers)", rate: 12, category: "Plastics & Rubber", chapter: "40" },

    // Chapter 42: Leather Goods
    { code: "4202", name: "Trunks, Suitcases, Handbags", rate: 18, category: "Leather & Travel", chapter: "42" },
    { code: "4203", name: "Articles of Apparel (Leather Jackets)", rate: 18, category: "Leather & Travel", chapter: "42" }, // Gloves

    // Chapter 44: Wood
    { code: "4410", name: "Particle Board", rate: 18, category: "Wood & Paper", chapter: "44" },
    { code: "4412", name: "Plywood, Veneered Panels", rate: 18, category: "Wood & Paper", chapter: "44" },

    // Chapter 48: Paper
    { code: "4802", name: "Uncoated Paper (Writing/Printing)", rate: 12, category: "Wood & Paper", chapter: "48" },
    { code: "4817", name: "Envelopes, Letter Cards", rate: 12, category: "Wood & Paper", chapter: "48" },
    { code: "4820", name: "Registers, Account Books, Notebooks", rate: 12, category: "Wood & Paper", chapter: "48" },
    { code: "4821", name: "Paper Labels", rate: 18, category: "Wood & Paper", chapter: "48" }, // Printed

    // Chapter 49: Printed Matter
    { code: "4901", name: "Printed Books, Brochures", rate: 0, category: "Wood & Paper", chapter: "49" },
    { code: "4902", name: "Newspapers, Journals", rate: 0, category: "Wood & Paper", chapter: "49" },

    // Chapter 50-63: Textiles (Simplified)
    { code: "5208", name: "Woven Fabrics of Cotton", rate: 5, category: "Textiles", chapter: "52" },
    { code: "5407", name: "Woven Fabrics of Synthetic Filament", rate: 5, category: "Textiles", chapter: "54" },
    { code: "6105", name: "Mens Shirts (Knitted/Crocheted)", rate: 12, category: "Textiles", chapter: "61" }, // <1000 5%
    { code: "6109", name: "T-Shirts, Singlets (Knitted)", rate: 12, category: "Textiles", chapter: "61" },
    { code: "6203", name: "Mens Suits, Jackets, Trousers", rate: 12, category: "Textiles", chapter: "62" },
    { code: "6204", name: "Womens Suits, Dresses, Skirts", rate: 12, category: "Textiles", chapter: "62" },
    { code: "6302", name: "Bed Linen, Table Linen", rate: 12, category: "Textiles", chapter: "63" },
    { code: "6304", name: "Curtains, Blinds", rate: 12, category: "Textiles", chapter: "63" },

    // Chapter 64: Footwear
    { code: "6401", name: "Waterproof Footwear", rate: 18, category: "Footwear & Headgear", chapter: "64" },
    { code: "6402", name: "Footwear (Rubber/Plastic Soles)", rate: 18, category: "Footwear & Headgear", chapter: "64" }, // <500 5% -> now 12%
    { code: "6403", name: "Footwear (Leather Uppers)", rate: 18, category: "Footwear & Headgear", chapter: "64" },

    // Chapter 65: Headgear
    { code: "6505", name: "Hats and Headgear (Knitted/Lace)", rate: 12, category: "Footwear & Headgear", chapter: "65" },
    { code: "6506", name: "Safety Headgear (Helmets)", rate: 18, category: "Footwear & Headgear", chapter: "65" },

    // Chapter 68: Stone/Plaster Articles
    { code: "6802", name: "Worked Monumental Stone (Granite/Marble)", rate: 18, category: "Stone & Glass", chapter: "68" },

    // Chapter 69: Ceramic
    { code: "6907", name: "Ceramic Flags and Paving (Tiles)", rate: 18, category: "Stone & Glass", chapter: "69" },
    { code: "6910", name: "Ceramic Sinks, Wash Basins", rate: 18, category: "Stone & Glass", chapter: "69" },

    // Chapter 70: Glass
    { code: "7009", name: "Glass Mirrors", rate: 18, category: "Stone & Glass", chapter: "70" },
    { code: "7013", name: "Glassware for Table/Kitchen", rate: 18, category: "Stone & Glass", chapter: "70" },

    // Chapter 71: Precious Metals
    { code: "7108", name: "Gold (unwrought, semi-manufactured)", rate: 3, category: "Metals", chapter: "71" },
    { code: "7113", name: "Articles of Jewelry", rate: 3, category: "Metals", chapter: "71" }, // Manufacturing 5%

    // Chapter 72: Iron & Steel
    { code: "7214", name: "Bars and Rods of Iron (TMT)", rate: 18, category: "Metals", chapter: "72" },

    // Chapter 73: Articles of Iron/Steel
    { code: "7323", name: "Table/Kitchen Articles (Steel Utensils)", rate: 12, category: "Metals", chapter: "73" },

    // Chapter 84: Machinery
    { code: "8401", name: "Nuclear Reactors; Fuel Elements", rate: 12, category: "Electronics & Machinery", chapter: "84" },
    { code: "8414", name: "Air/Vacuum Pumps, Fans", rate: 18, category: "Electronics & Machinery", chapter: "84" },
    { code: "8415", name: "Air Conditioning Machines", rate: 28, category: "Electronics & Machinery", chapter: "84" },
    { code: "8418", name: "Refrigerators, Freezers", rate: 18, category: "Electronics & Machinery", chapter: "84" },
    { code: "8422", name: "Dish Washing Machines", rate: 18, category: "Electronics & Machinery", chapter: "84" },
    { code: "8443", name: "Printers, Photocopying Machines", rate: 18, category: "Electronics & Machinery", chapter: "84" },
    { code: "8450", name: "Washing Machines", rate: 18, category: "Electronics & Machinery", chapter: "84" },
    { code: "8471", name: "Automatic Data Processing Machines (Laptops)", rate: 18, category: "Electronics & Machinery", chapter: "84" },

    // Chapter 85: Electrical Machinery
    { code: "8504", name: "Electrical Transformers, UPS", rate: 18, category: "Electronics & Machinery", chapter: "85" },
    { code: "8506", name: "Primary Cells and Batteries", rate: 18, category: "Electronics & Machinery", chapter: "85" },
    { code: "8508", name: "Vacuum Cleaners", rate: 18, category: "Electronics & Machinery", chapter: "85" },
    { code: "8516", name: "Electric Geysers, Irons, Ovens", rate: 18, category: "Electronics & Machinery", chapter: "85" },
    { code: "8517", name: "Telephone Sets (Smartphones)", rate: 18, category: "Electronics & Machinery", chapter: "85" },
    { code: "8528", name: "Monitors and Projectors (TVs)", rate: 18, category: "Electronics & Machinery", chapter: "85" }, // <32 inch 18%, >32 28%
    { code: "8544", name: "Insulated Wire, Cable", rate: 18, category: "Electronics & Machinery", chapter: "85" },

    // Chapter 87: Vehicles
    { code: "8703", name: "Motor Cars", rate: 28, category: "Vehicles", chapter: "87" }, // + Cess
    { code: "8711", name: "Motorcycles", rate: 28, category: "Vehicles", chapter: "87" },
    { code: "8712", name: "Bicycles", rate: 12, category: "Vehicles", chapter: "87" },

    // Chapter 88: Aircraft
    { code: "8801", name: "Balloons and Dirigibles; Gliders", rate: 18, category: "Vehicles", chapter: "88" },
    { code: "8802", name: "Aircraft (Helicopters, Aeroplanes), Spacecraft", rate: 18, category: "Vehicles", chapter: "88" }, // Private 28%

    // Chapter 90: Instruments
    { code: "9004", name: "Spectacles, Goggles", rate: 18, category: "Instruments & Clocks", chapter: "90" }, // Frames 12%

    // Chapter 91: Clocks
    { code: "9101", name: "Wrist Watches (Precious Metal)", rate: 18, category: "Instruments & Clocks", chapter: "91" },
    { code: "9102", name: "Wrist Watches (Other)", rate: 18, category: "Instruments & Clocks", chapter: "91" },
    { code: "9105", name: "Other Clocks (Wall Clocks)", rate: 18, category: "Instruments & Clocks", chapter: "91" },

    // Chapter 93: Arms
    { code: "9301", name: "Military Weapons (Tanks, Artillery)", rate: 18, category: "Arms", chapter: "93" },
    { code: "9302", name: "Revolvers and Pistols", rate: 28, category: "Arms", chapter: "93" },

    // Chapter 94: Furniture
    { code: "9401", name: "Seats (Chairs, Sofas)", rate: 18, category: "Furniture & Lights", chapter: "94" },
    { code: "9403", name: "Other Furniture", rate: 18, category: "Furniture & Lights", chapter: "94" },
    { code: "9404", name: "Mattress Supports, Bedding", rate: 18, category: "Furniture & Lights", chapter: "94" },
    { code: "9405", name: "Lamps and Lighting Fittings (LED)", rate: 18, category: "Furniture & Lights", chapter: "94" }, // LED 12%?

    // Chapter 95: Toys
    { code: "9503", name: "Tricycles, Scooters, Dolls, Toys", rate: 12, category: "Furniture & Lights", chapter: "95" }, // Electronic 18%
    { code: "9504", name: "Video Game Consoles", rate: 28, category: "Furniture & Lights", chapter: "95" }, // 18% now?

    // Chapter 96: Misc Manufactured Articles
    { code: "9603", name: "Brooms, Brushes", rate: 5, category: "Furniture & Lights", chapter: "96" }, // 0 or 5
    { code: "9608", name: "Pens (Ball point, Felt tipped)", rate: 18, category: "Furniture & Lights", chapter: "96" }, // 12% now?
    { code: "9619", name: "Sanitary Pads, Napkins", rate: 0, category: "Furniture & Lights", chapter: "96" },

    // SERVICES (SAC)
    { code: "9954", name: "Construction Services", rate: 18, category: "Services", chapter: "99" }, // Affordable 1%/5%
    { code: "9963", name: "Accommodation, Food & Beverage (Hotels)", rate: 12, category: "Services", chapter: "99" }, // <1000 0, 1000-7500 12, >7500 18
    { code: "9964", name: "Passenger Transport Services", rate: 5, category: "Services", chapter: "99" },
    { code: "9965", name: "Goods Transport Services (GTA)", rate: 5, category: "Services", chapter: "99" },
    { code: "9967", name: "Supporting Transport Services", rate: 18, category: "Services", chapter: "99" },
    { code: "9969", name: "Electricity Distribution", rate: 0, category: "Services", chapter: "99" }, // Exempt
    { code: "9971", name: "Financial Services", rate: 18, category: "Services", chapter: "99" },
    { code: "9972", name: "Real Estate Services", rate: 18, category: "Services", chapter: "99" },
    { code: "9983", name: "Other Professional/Technical Services (IT)", rate: 18, category: "Services", chapter: "99" },
    { code: "9985", name: "Support Services", rate: 18, category: "Services", chapter: "99" },
    { code: "9996", name: "Recreational, Cultural Services", rate: 18, category: "Services", chapter: "99" }
];
