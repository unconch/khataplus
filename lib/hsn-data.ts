export interface HSNItem {
    code: string;
    name: string;
    rate: number;
    category: string;
    chapter?: string;
}

export const HSN_CATEGORIES = [
    "All",
    "Groceries",
    "Electronics",
    "Textiles",
    "Healthcare",
    "Hardware",
    "Furniture",
    "Automobile",
    "Jewelry",
    "Footwear",
    "Services",
    "Stationery"
];

export const hsnData: HSNItem[] = [
    // Groceries & Food (0%, 5%, 12%, 18%)
    { code: "1006", name: "Rice (Basmati, White, Brown)", rate: 0, category: "Groceries" },
    { code: "1001", name: "Wheat and Meslin", rate: 0, category: "Groceries" },
    { code: "1101", name: "Wheat Flour (Atta, Maida, Suji)", rate: 0, category: "Groceries" },
    { code: "1512", name: "Sunflower Oil, Vegetable Oil", rate: 5, category: "Groceries" },
    { code: "0401", name: "Milk (Fresh, Pasteurized)", rate: 0, category: "Groceries" },
    { code: "0402", name: "Milk Powder, Condensed Milk", rate: 12, category: "Groceries" },
    { code: "0405", name: "Butter, Ghee", rate: 12, category: "Groceries" },
    { code: "0406", name: "Cheese, Paneer", rate: 12, category: "Groceries" },
    { code: "0901", name: "Coffee Beans, Roasted Coffee", rate: 5, category: "Groceries" },
    { code: "0902", name: "Tea (Black, Green)", rate: 5, category: "Groceries" },
    { code: "1701", name: "Sugar (White, Brown)", rate: 5, category: "Groceries" },
    { code: "1905", name: "Bread (Plain, Unbranded)", rate: 0, category: "Groceries" },
    { code: "1905", name: "Biscuits, Rusks, Cakes", rate: 18, category: "Groceries" },
    { code: "2106", name: "Namkeen, Bhujia, Snacks", rate: 12, category: "Groceries" },
    { code: "0701", name: "Potatoes (Fresh)", rate: 0, category: "Groceries" },
    { code: "0702", name: "Tomatoes (Fresh)", rate: 0, category: "Groceries" },
    { code: "0703", name: "Onions, Garlic (Fresh)", rate: 0, category: "Groceries" },
    { code: "0803", name: "Bananas (Fresh)", rate: 0, category: "Groceries" },
    { code: "0804", name: "Dates, Figs, Pineapples (Fresh)", rate: 0, category: "Groceries" },
    { code: "2007", name: "Jams, Fruit Jellies", rate: 12, category: "Groceries" },
    { code: "2008", name: "Roasted Nuts, Seeds", rate: 12, category: "Groceries" },
    { code: "2103", name: "Sauces, Ketchup, Mustard", rate: 12, category: "Groceries" },
    { code: "2201", name: "Mineral Water (Branded)", rate: 18, category: "Groceries" },
    { code: "2202", name: "Fruit Juices (Sweetened)", rate: 12, category: "Groceries" },
    { code: "1516", name: "Vanaspati, Vegetable Ghee", rate: 5, category: "Groceries" },
    { code: "1806", name: "Chocolates, Cocoa Products", rate: 18, category: "Groceries" },
    { code: "1901", name: "Health Drinks (Malt based)", rate: 18, category: "Groceries" },

    // Electronics & IT (12%, 18%)
    { code: "8517", name: "Mobile Phones, Smartphones", rate: 18, category: "Electronics" },
    { code: "8471", name: "Laptops, Tablets, Computers", rate: 18, category: "Electronics" },
    { code: "8528", name: "Monitors, Projectors, TV", rate: 18, category: "Electronics" },
    { code: "8443", name: "Printers, Scanners, Photocopy", rate: 18, category: "Electronics" },
    { code: "8504", name: "Adapters, Chargers, UPS", rate: 18, category: "Electronics" },
    { code: "8518", name: "Headphones, Speakers, Mics", rate: 18, category: "Electronics" },
    { code: "8523", name: "Pen Drives, Hard Disks, SD Cards", rate: 18, category: "Electronics" },
    { code: "8525", name: "CCTV Cameras, Digital Cameras", rate: 18, category: "Electronics" },
    { code: "8473", name: "RAM, Motherboards, PC Parts", rate: 18, category: "Electronics" },
    { code: "8516", name: "Electric Irons, Kettles, Heaters", rate: 18, category: "Electronics" },
    { code: "8415", name: "Air Conditioners (AC)", rate: 28, category: "Electronics" },
    { code: "8418", name: "Refrigerators, Freezers", rate: 18, category: "Electronics" },
    { code: "8450", name: "Washing Machines", rate: 18, category: "Electronics" },
    { code: "8509", name: "Mixers, Grinders, Juicers", rate: 18, category: "Electronics" },
    { code: "8539", name: "LED Bulbs, Tube Lights", rate: 12, category: "Electronics" },
    { code: "8414", name: "Electric Ceiling Fans", rate: 18, category: "Electronics" },
    { code: "8507", name: "Inverter Batteries", rate: 28, category: "Electronics" },

    // Textiles & Garments (5%, 12%)
    { code: "6109", name: "T-Shirts, Cotton Vests", rate: 12, category: "Textiles" },
    { code: "6203", name: "Mens Trousers, Suits, Blazers", rate: 12, category: "Textiles" },
    { code: "6204", name: "Womens Dresses, Skirts, Suits", rate: 12, category: "Textiles" },
    { code: "6205", name: "Mens Shirts (Cotton, Linen)", rate: 12, category: "Textiles" },
    { code: "5208", name: "Cotton Fabric, Woven Cloth", rate: 5, category: "Textiles" },
    { code: "5407", name: "Synthetic Fabric (Polyester)", rate: 5, category: "Textiles" },
    { code: "6302", name: "Bed Sheets, Pillow Covers", rate: 12, category: "Textiles" },
    { code: "6304", name: "Curtains, Cushion Covers", rate: 12, category: "Textiles" },
    { code: "6115", name: "Socks, Stockings, Hosiery", rate: 12, category: "Textiles" },
    { code: "6207", name: "Mens Underwear, Briefs", rate: 12, category: "Textiles" },
    { code: "6208", name: "Womens Nightdresses, Slips", rate: 12, category: "Textiles" },
    { code: "5802", name: "Towels, Terry Fabrics", rate: 5, category: "Textiles" },
    { code: "6301", name: "Blankets, Traveling Rugs", rate: 5, category: "Textiles" },

    // Footwear (5%, 12%, 18%)
    { code: "6403", name: "Leather Shoes, Formal Shoes", rate: 18, category: "Footwear" },
    { code: "6402", name: "Sports Shoes, Sneakers (Rubber)", rate: 18, category: "Footwear" },
    { code: "6404", name: "Canvas Shoes, Casual Shoes", rate: 18, category: "Footwear" },
    { code: "6401", name: "Waterproof Footwear, Gumboots", rate: 12, category: "Footwear" },
    { code: "6405", name: "Hawai Chappals, Flip Flops", rate: 5, category: "Footwear" },
    { code: "6403", name: "School Shoes (Formal)", rate: 12, category: "Footwear" },

    // Healthcare & Pharma (5%, 12%)
    { code: "3004", name: "Medicine (Allopathic, Ayurvedic)", rate: 12, category: "Healthcare" },
    { code: "3002", name: "Vaccines, Blood Products", rate: 5, category: "Healthcare" },
    { code: "3006", name: "First Aid Kits, Bandages", rate: 12, category: "Healthcare" },
    { code: "3304", name: "Face Creams, Makeup, Sunscreen", rate: 18, category: "Healthcare" },
    { code: "3305", name: "Hair Oils, Shampoos", rate: 18, category: "Healthcare" },
    { code: "3306", name: "Toothpastes, Mouthwash", rate: 18, category: "Healthcare" },
    { code: "9021", name: "Hearing Aids, Orthopedic Gear", rate: 0, category: "Healthcare" },
    { code: "3307", name: "Shaving Creams, Deodorants", rate: 18, category: "Healthcare" },
    { code: "3808", name: "Hand Sanitizer (Alcohol base)", rate: 18, category: "Healthcare" },
    { code: "9018", name: "BP Monitors, Thermometers", rate: 12, category: "Healthcare" },

    // Hardware & Construction (18%, 28%)
    { code: "7214", name: "Steel Bars, TMT Rods", rate: 18, category: "Hardware" },
    { code: "2523", name: "Portland Cement, White Cement", rate: 28, category: "Hardware" },
    { code: "3208", name: "Paints, Varnishes, Enamels", rate: 18, category: "Hardware" },
    { code: "3917", name: "PVC Pipes, Plastic Fittings", rate: 18, category: "Hardware" },
    { code: "7307", name: "Iron Fittings, Screws, Bolts", rate: 18, category: "Hardware" },
    { code: "8544", name: "Electrical Wires, Cables", rate: 18, category: "Hardware" },
    { code: "8536", name: "Switches, Sockets, Fuses", rate: 18, category: "Hardware" },
    { code: "7411", name: "Copper Pipes and Tubes", rate: 18, category: "Hardware" },
    { code: "6910", name: "Ceramic Sinks, Wash Basins", rate: 18, category: "Hardware" },
    { code: "6802", name: "Marble, Granite Tiles", rate: 18, category: "Hardware" },
    { code: "6907", name: "Vitrified Tiles (Ceramic)", rate: 18, category: "Hardware" },
    { code: "4410", name: "Plywood, Flush Doors", rate: 18, category: "Hardware" },

    // Furniture & Home (12%, 18%)
    { code: "9403", name: "Wooden Furniture (Beds, Tables)", rate: 18, category: "Furniture" },
    { code: "9401", name: "Sofas, Chairs, Seating", rate: 18, category: "Furniture" },
    { code: "9404", name: "Mattresses, Quilts", rate: 18, category: "Furniture" },
    { code: "9403", name: "Steel Almirah, Cabinets", rate: 18, category: "Furniture" },
    { code: "9405", name: "Lamp Shades, Light Fittings", rate: 18, category: "Furniture" },
    { code: "7009", name: "Glass Mirrors, Wall Mirrors", rate: 18, category: "Furniture" },
    { code: "3924", name: "Plastic Buckets, Mugs", rate: 18, category: "Furniture" },

    // Automobile & Parts (18%, 28%)
    { code: "8711", name: "Two Wheelers (Motorcycles)", rate: 28, category: "Automobile" },
    { code: "8703", name: "Passenger Cars (Petrol/Diesel)", rate: 28, category: "Automobile" },
    { code: "8708", name: "Car Spare Parts, Bumpers", rate: 28, category: "Automobile" },
    { code: "4011", name: "Tyres and Tubes (Car, Bike)", rate: 28, category: "Automobile" },
    { code: "2710", name: "Engine Oil, Lubricants", rate: 18, category: "Automobile" },
    { code: "8511", name: "Spark Plugs, Ignitions", rate: 28, category: "Automobile" },
    { code: "8714", name: "Bicycle Spare Parts", rate: 12, category: "Automobile" },

    // Jewelry (3%)
    { code: "7113", name: "Gold Jewelry (Unset)", rate: 3, category: "Jewelry" },
    { code: "7113", name: "Diamond Jewelry", rate: 3, category: "Jewelry" },
    { code: "7113", name: "Silver Jewelry", rate: 3, category: "Jewelry" },
    { code: "7113", name: "Platinum Jewelry", rate: 3, category: "Jewelry" },
    { code: "7117", name: "Imitation Jewelry", rate: 3, category: "Jewelry" },

    // Stationery & Office (12%, 18%)
    { code: "4820", name: "Notebooks, Registers, Diaries", rate: 12, category: "Stationery" },
    { code: "9608", name: "Pens, Ballpoints, Markers", rate: 18, category: "Stationery" },
    { code: "9609", name: "Pencils, Crayons, Pastels", rate: 12, category: "Stationery" },
    { code: "4817", name: "Envelopes, Postcards", rate: 12, category: "Stationery" },
    { code: "4802", name: "A4 Paper, Printing Paper", rate: 12, category: "Stationery" },
    { code: "4016", name: "Erasers (Rubber)", rate: 12, category: "Stationery" },
    { code: "9017", name: "Geometry Boxes, Rulers", rate: 12, category: "Stationery" },

    // Services (SAC Codes) (18%)
    { code: "9983", name: "IT Services, SAAS, Computing", rate: 18, category: "Services" },
    { code: "9982", name: "Legal and Accounting Services", rate: 18, category: "Services" },
    { code: "9972", name: "Real Estate Services (Rent)", rate: 18, category: "Services" },
    { code: "9963", name: "Hotel & Restaurant Services", rate: 18, category: "Services" },
    { code: "9964", name: "Transport (Goods, Passengers)", rate: 5, category: "Services" },
    { code: "9987", name: "Maintenance & Repair Services", rate: 18, category: "Services" },
    { code: "9992", name: "Educational & Training Services", rate: 18, category: "Services" },
    { code: "9985", name: "Travel Agent Services", rate: 18, category: "Services" },
    { code: "9991", name: "Government Services (Statutory)", rate: 18, category: "Services" },
    { code: "9971", name: "Financial & Insurance Services", rate: 18, category: "Services" },
];
