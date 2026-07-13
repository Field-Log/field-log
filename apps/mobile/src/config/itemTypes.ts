export type FieldInputType =
  | "text"
  | "number"
  | "picker"
  | "boolean"
  | "date"
  | "textarea";

export type SpecField = {
  key: string;
  label: string;
  input: FieldInputType;
  options?: string[];
  unit?: string;
  placeholder?: string;
};

export type SpecSection = {
  title: string;
  fields: SpecField[];
};

export type ItemTypeConfig = {
  type: string;
  label: string;
  specSections: SpecSection[];
};

export const ITEM_TYPES: ItemTypeConfig[] = [
  {
    type: "fountain_pen",
    label: "Fountain Pen",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "filling_system",
            label: "Filling System",
            input: "picker",
            options: [
              "c_c",
              "cartridge_only",
              "eyedropper",
              "piston",
              "vac",
              "other",
            ],
          },
          { key: "nib_brand", label: "Nib Brand", input: "text" },
          {
            key: "nib_material",
            label: "Nib Material",
            input: "picker",
            options: ["gold", "steel", "titanium", "ebonite", "other"],
          },
          {
            key: "nib_size",
            label: "Nib Size",
            input: "text",
            placeholder: "e.g. EF, F, M, B, 1.1mm",
          },
          {
            key: "nib_grind",
            label: "Nib Grind",
            input: "text",
            placeholder: "e.g. stub, italic, cursive italic",
          },
          {
            key: "feed_material",
            label: "Feed Material",
            input: "picker",
            options: ["ebonite", "plastic", "other"],
          },
          { key: "section_material", label: "Section Material", input: "text" },
          { key: "trim_material", label: "Trim Material", input: "text" },
          { key: "clip", label: "Clip", input: "boolean" },
          {
            key: "posting",
            label: "Posting",
            input: "picker",
            options: ["posts", "doesnt_post", "with_cap_only"],
          },
          {
            key: "ink_capacity_ml",
            label: "Ink Capacity",
            input: "number",
            unit: "ml",
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "inked", label: "Inked", input: "boolean" },
          { key: "current_ink", label: "Current Ink", input: "text" },
          { key: "fill_date", label: "Fill Date", input: "date" },
          { key: "last_inked", label: "Last Inked", input: "date" },
          { key: "last_used", label: "Last Used", input: "date" },
        ],
      },
    ],
  },
  {
    type: "ballpoint_pen",
    label: "Pen (Ballpoint / Rollerball / Gel)",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "refill_type",
            label: "Refill Type",
            input: "picker",
            options: ["ballpoint", "rollerball", "gel", "other"],
          },
          { key: "refill_brand", label: "Refill Brand", input: "text" },
          { key: "refill_model", label: "Refill Model", input: "text" },
          {
            key: "tip_size_mm",
            label: "Tip Size",
            input: "number",
            unit: "mm",
          },
          { key: "ink_color", label: "Ink Color", input: "text" },
          {
            key: "mechanism",
            label: "Mechanism",
            input: "picker",
            options: ["click", "twist", "capped", "other"],
          },
          { key: "clip", label: "Clip", input: "boolean" },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "installed_refill", label: "Installed Refill", input: "text" },
          { key: "installed_date", label: "Installed Date", input: "date" },
          { key: "last_refill", label: "Last Refill", input: "date" },
        ],
      },
    ],
  },
  {
    type: "pencil",
    label: "Pencil",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "lead_size_mm",
            label: "Lead Size",
            input: "number",
            unit: "mm",
          },
          {
            key: "lead_grade",
            label: "Lead Grade",
            input: "text",
            placeholder: "e.g. HB, 2B, 4H",
          },
          { key: "lead_brand", label: "Lead Brand", input: "text" },
          {
            key: "mechanism",
            label: "Mechanism",
            input: "picker",
            options: ["mechanical", "wooden", "clutch", "other"],
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "installed_lead", label: "Installed Lead", input: "text" },
          {
            key: "eraser_installed",
            label: "Eraser Installed",
            input: "boolean",
          },
        ],
      },
    ],
  },
  {
    type: "ink",
    label: "Ink",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "ink_name", label: "Ink Name", input: "text" },
          { key: "series", label: "Series", input: "text" },
          { key: "color_family", label: "Color Family", input: "text" },
          {
            key: "bottle_size_ml",
            label: "Bottle Size",
            input: "number",
            unit: "ml",
          },
        ],
      },
      {
        title: "Properties",
        fields: [
          { key: "shading", label: "Shading", input: "boolean" },
          { key: "sheen", label: "Sheen", input: "boolean" },
          { key: "shimmer", label: "Shimmer", input: "boolean" },
          {
            key: "water_resistance",
            label: "Water Resistance",
            input: "picker",
            options: ["none", "low", "medium", "high", "waterproof"],
          },
          {
            key: "lubrication",
            label: "Lubrication",
            input: "picker",
            options: ["dry", "neutral", "lubricated", "very_lubricated"],
          },
          {
            key: "dry_time",
            label: "Dry Time",
            input: "picker",
            options: ["fast", "medium", "slow", "very_slow"],
          },
        ],
      },
      {
        title: "Inventory",
        fields: [
          { key: "date_opened", label: "Date Opened", input: "date" },
          {
            key: "remaining_pct",
            label: "Remaining",
            input: "number",
            unit: "%",
          },
        ],
      },
    ],
  },
  {
    type: "notebook",
    label: "Notebook",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "paper_brand", label: "Paper Brand", input: "text" },
          {
            key: "paper_weight_gsm",
            label: "Paper Weight",
            input: "number",
            unit: "gsm",
          },
          { key: "paper_color", label: "Paper Color", input: "text" },
          {
            key: "ruling",
            label: "Ruling",
            input: "picker",
            options: ["blank", "dot_grid", "lined", "grid", "other"],
          },
          {
            key: "size",
            label: "Size",
            input: "picker",
            options: ["a4", "a5", "b5", "pocket", "traveler", "other"],
          },
          {
            key: "binding",
            label: "Binding",
            input: "picker",
            options: ["sewn", "perfect", "spiral", "coptic", "staple", "other"],
          },
          { key: "cover_material", label: "Cover Material", input: "text" },
          { key: "page_count", label: "Page Count", input: "number" },
        ],
      },
      {
        title: "Usage",
        fields: [
          { key: "start_date", label: "Start Date", input: "date" },
          { key: "finish_date", label: "Finish Date", input: "date" },
        ],
      },
    ],
  },
  {
    type: "knife",
    label: "Knife",
    specSections: [
      {
        title: "Blade",
        fields: [
          {
            key: "blade_steel",
            label: "Blade Steel",
            input: "text",
            placeholder: "e.g. S30V, M390, 14C28N",
          },
          {
            key: "blade_length_mm",
            label: "Blade Length",
            input: "number",
            unit: "mm",
          },
          {
            key: "blade_thickness_mm",
            label: "Blade Thickness",
            input: "number",
            unit: "mm",
          },
          {
            key: "blade_shape",
            label: "Blade Shape",
            input: "picker",
            options: [
              "drop_point",
              "clip_point",
              "tanto",
              "wharncliffe",
              "sheepsfoot",
              "spear_point",
              "other",
            ],
          },
          {
            key: "grind",
            label: "Grind",
            input: "picker",
            options: [
              "flat",
              "hollow",
              "convex",
              "saber",
              "scandinavian",
              "other",
            ],
          },
          {
            key: "blade_finish",
            label: "Blade Finish",
            input: "picker",
            options: [
              "stonewash",
              "satin",
              "bead_blast",
              "dlc",
              "cerakote",
              "mirror",
              "other",
            ],
          },
          {
            key: "edge_type",
            label: "Edge Type",
            input: "picker",
            options: ["plain", "serrated", "combo"],
          },
        ],
      },
      {
        title: "Handle",
        fields: [
          {
            key: "handle_material",
            label: "Handle Material",
            input: "text",
            placeholder: "e.g. G10, titanium, carbon fiber",
          },
          {
            key: "lock_type",
            label: "Lock Type",
            input: "picker",
            options: [
              "liner",
              "frame",
              "axis",
              "compression",
              "back",
              "slip_joint",
              "other",
            ],
          },
          {
            key: "bearings",
            label: "Bearings",
            input: "picker",
            options: [
              "none",
              "bronze_washers",
              "caged_ball",
              "ceramic",
              "other",
            ],
          },
          {
            key: "pivot",
            label: "Pivot",
            input: "picker",
            options: ["standard", "stepped", "bushing", "other"],
          },
          { key: "clip", label: "Clip", input: "boolean" },
        ],
      },
      {
        title: "Current State",
        fields: [
          {
            key: "edge_condition",
            label: "Edge Condition",
            input: "picker",
            options: ["razor_sharp", "sharp", "dull", "needs_reprofile"],
          },
          {
            key: "carry_configuration",
            label: "Carry Configuration",
            input: "text",
          },
        ],
      },
    ],
  },
  {
    type: "multitool",
    label: "Multitool",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "tool_count", label: "Tool Count", input: "number" },
          { key: "blade_steel", label: "Blade Steel", input: "text" },
          { key: "has_pliers", label: "Has Pliers", input: "boolean" },
          { key: "has_bit_driver", label: "Has Bit Driver", input: "boolean" },
          { key: "has_scissors", label: "Has Scissors", input: "boolean" },
          { key: "has_saw", label: "Has Saw", input: "boolean" },
          { key: "has_file", label: "Has File", input: "boolean" },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "installed_bit", label: "Installed Bit", input: "text" },
        ],
      },
    ],
  },
  {
    type: "tool",
    label: "Tool",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "tool_type",
            label: "Tool Type",
            input: "text",
            placeholder: "e.g. screwdriver, wrench, pry bar",
          },
          {
            key: "drive_size",
            label: "Drive Size",
            input: "text",
            placeholder: 'e.g. 1/4", 3/8"',
          },
          {
            key: "measurement_standard",
            label: "Measurement Standard",
            input: "picker",
            options: ["imperial", "metric", "both"],
          },
          { key: "included_bits", label: "Included Bits", input: "textarea" },
          {
            key: "included_accessories",
            label: "Included Accessories",
            input: "textarea",
          },
        ],
      },
    ],
  },
  {
    type: "flashlight",
    label: "Flashlight",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "led",
            label: "LED",
            input: "text",
            placeholder: "e.g. Cree XHP70.2, Luminus SST-40",
          },
          { key: "driver", label: "Driver", input: "text" },
          {
            key: "battery_type",
            label: "Battery Type",
            input: "picker",
            options: [
              "aa",
              "aaa",
              "18650",
              "21700",
              "cr123",
              "14500",
              "26650",
              "usb_c",
              "other",
            ],
          },
          {
            key: "max_lumens",
            label: "Max Lumens",
            input: "number",
            unit: "lm",
          },
          { key: "candela", label: "Candela", input: "number", unit: "cd" },
          { key: "throw_meters", label: "Throw", input: "number", unit: "m" },
          {
            key: "waterproof_rating",
            label: "Waterproof Rating",
            input: "picker",
            options: ["none", "ipx4", "ipx7", "ipx8", "ip67", "ip68"],
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          {
            key: "installed_battery",
            label: "Installed Battery",
            input: "text",
          },
          { key: "last_charged", label: "Last Charged", input: "date" },
        ],
      },
    ],
  },
  {
    type: "watch",
    label: "Watch",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "movement",
            label: "Movement",
            input: "picker",
            options: [
              "automatic",
              "manual",
              "quartz",
              "solar",
              "kinetic",
              "other",
            ],
          },
          {
            key: "case_material",
            label: "Case Material",
            input: "text",
            placeholder: "e.g. stainless steel, titanium",
          },
          {
            key: "crystal",
            label: "Crystal",
            input: "picker",
            options: ["mineral", "sapphire", "acrylic", "hardlex"],
          },
          { key: "dial_color", label: "Dial Color", input: "text" },
          {
            key: "water_resistance_atm",
            label: "Water Resistance",
            input: "number",
            unit: "ATM",
          },
          {
            key: "lug_width_mm",
            label: "Lug Width",
            input: "number",
            unit: "mm",
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "strap_installed", label: "Strap Installed", input: "text" },
          { key: "last_worn", label: "Last Worn", input: "date" },
        ],
      },
    ],
  },
  {
    type: "wallet",
    label: "Wallet",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "card_capacity", label: "Card Capacity", input: "number" },
          { key: "rfid", label: "RFID Blocking", input: "boolean" },
          { key: "coin_pocket", label: "Coin Pocket", input: "boolean" },
        ],
      },
    ],
  },
  {
    type: "key_organizer",
    label: "Key Organizer",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "key_capacity", label: "Key Capacity", input: "number" },
          {
            key: "organizer_type",
            label: "Organizer Type",
            input: "picker",
            options: ["strap", "frame", "bar", "pouch", "other"],
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "current_keys", label: "Current Keys", input: "number" },
        ],
      },
    ],
  },
  {
    type: "bag",
    label: "Bag",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "capacity_liters",
            label: "Capacity",
            input: "number",
            unit: "L",
          },
          {
            key: "laptop_size_inches",
            label: "Laptop Size",
            input: "number",
            unit: '"',
          },
          {
            key: "empty_weight_g",
            label: "Empty Weight",
            input: "number",
            unit: "g",
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          {
            key: "current_loadout",
            label: "Current Loadout",
            input: "textarea",
          },
        ],
      },
    ],
  },
  {
    type: "fidget",
    label: "Fidget",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "fidget_type",
            label: "Fidget Type",
            input: "picker",
            options: [
              "slider",
              "spinner",
              "cube",
              "clicker",
              "begleri",
              "worry_stone",
              "other",
            ],
          },
          { key: "mechanism_type", label: "Mechanism Type", input: "text" },
          {
            key: "bearings",
            label: "Bearings",
            input: "text",
            placeholder: "e.g. ceramic, steel, hybrid",
          },
          { key: "magnet_count", label: "Magnet Count", input: "number" },
          {
            key: "magnet_strength",
            label: "Magnet Strength",
            input: "text",
            placeholder: "e.g. N52, N48",
          },
          { key: "buttons", label: "Buttons", input: "number" },
          { key: "detent", label: "Detent", input: "text" },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "configuration", label: "Configuration", input: "text" },
        ],
      },
    ],
  },
  {
    type: "electronics",
    label: "Electronics",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "device_type",
            label: "Device Type",
            input: "text",
            placeholder: "e.g. laptop, phone, tablet, charger",
          },
          { key: "processor", label: "Processor", input: "text" },
          { key: "ram_gb", label: "RAM", input: "number", unit: "GB" },
          { key: "storage_gb", label: "Storage", input: "number", unit: "GB" },
          { key: "os", label: "OS", input: "text" },
          { key: "firmware", label: "Firmware", input: "text" },
        ],
      },
      {
        title: "Current State",
        fields: [
          {
            key: "battery_health_pct",
            label: "Battery Health",
            input: "number",
            unit: "%",
          },
          { key: "accessories", label: "Accessories", input: "textarea" },
        ],
      },
    ],
  },
  {
    type: "audio",
    label: "Audio",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "audio_type",
            label: "Audio Type",
            input: "picker",
            options: [
              "iem",
              "headphone",
              "earbuds",
              "speaker",
              "dac_amp",
              "other",
            ],
          },
          {
            key: "wired_wireless",
            label: "Wired / Wireless",
            input: "picker",
            options: ["wired", "wireless", "both"],
          },
          {
            key: "codec",
            label: "Codec",
            input: "text",
            placeholder: "e.g. aptX HD, LDAC, AAC",
          },
          {
            key: "battery_life_hrs",
            label: "Battery Life",
            input: "number",
            unit: "hrs",
          },
        ],
      },
    ],
  },
  {
    type: "camera",
    label: "Camera",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "sensor",
            label: "Sensor",
            input: "text",
            placeholder: "e.g. 35mm full frame, APS-C, MFT",
          },
          {
            key: "resolution_mp",
            label: "Resolution",
            input: "number",
            unit: "MP",
          },
          {
            key: "mount",
            label: "Mount",
            input: "text",
            placeholder: "e.g. Sony E, Canon RF, Nikon Z",
          },
          { key: "shutter_count", label: "Shutter Count", input: "number" },
        ],
      },
    ],
  },
  {
    type: "lens",
    label: "Lens",
    specSections: [
      {
        title: "Specifications",
        fields: [
          { key: "mount", label: "Mount", input: "text" },
          {
            key: "focal_length",
            label: "Focal Length",
            input: "text",
            placeholder: "e.g. 50mm, 24-70mm",
          },
          {
            key: "aperture",
            label: "Aperture",
            input: "text",
            placeholder: "e.g. f/1.4, f/2.8",
          },
          {
            key: "filter_size_mm",
            label: "Filter Size",
            input: "number",
            unit: "mm",
          },
        ],
      },
    ],
  },
  {
    type: "optic",
    label: "Optic",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "optic_type",
            label: "Optic Type",
            input: "picker",
            options: [
              "red_dot",
              "prism",
              "lpvo",
              "scope",
              "binocular",
              "monocular",
              "other",
            ],
          },
          {
            key: "magnification",
            label: "Magnification",
            input: "text",
            placeholder: "e.g. 1x, 1-6x, 10x42",
          },
          { key: "reticle", label: "Reticle", input: "text" },
          {
            key: "objective_size_mm",
            label: "Objective Size",
            input: "number",
            unit: "mm",
          },
        ],
      },
      {
        title: "Current State",
        fields: [
          { key: "battery", label: "Battery", input: "text" },
          {
            key: "brightness_setting",
            label: "Brightness Setting",
            input: "text",
          },
          {
            key: "zero_distance_meters",
            label: "Zero Distance",
            input: "number",
            unit: "m",
          },
        ],
      },
    ],
  },
  {
    type: "medical_kit",
    label: "Medical Kit",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "kit_type",
            label: "Kit Type",
            input: "picker",
            options: ["ifak", "car", "home", "travel", "other"],
          },
          { key: "has_tourniquet", label: "Has Tourniquet", input: "boolean" },
          { key: "has_gauze", label: "Has Gauze", input: "boolean" },
          { key: "has_chest_seal", label: "Has Chest Seal", input: "boolean" },
          { key: "has_airway", label: "Has Airway", input: "boolean" },
          { key: "medications", label: "Medications", input: "textarea" },
        ],
      },
    ],
  },
  {
    type: "outdoor_gear",
    label: "Outdoor Gear",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "gear_type",
            label: "Gear Type",
            input: "text",
            placeholder: "e.g. tarp, hammock, fire starter, compass",
          },
        ],
      },
    ],
  },
  {
    type: "clothing",
    label: "Clothing",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "garment_type",
            label: "Garment Type",
            input: "text",
            placeholder: "e.g. jacket, pants, base layer, socks",
          },
          { key: "size", label: "Size", input: "text" },
          { key: "color", label: "Color", input: "text" },
        ],
      },
    ],
  },
  {
    type: "consumable",
    label: "Consumable",
    specSections: [
      {
        title: "Specifications",
        fields: [
          {
            key: "consumable_type",
            label: "Consumable Type",
            input: "text",
            placeholder: "e.g. batteries, lighter fluid, lubricant",
          },
          { key: "quantity", label: "Quantity", input: "number" },
          { key: "expiration_date", label: "Expiration Date", input: "date" },
          { key: "installed_in", label: "Installed In", input: "text" },
        ],
      },
    ],
  },
];

export const ITEM_TYPE_MAP: Record<string, ItemTypeConfig> = Object.fromEntries(
  ITEM_TYPES.map((t) => [t.type, t]),
);

const LABEL_OVERRIDES: Record<string, string> = {
  // Fountain pen
  c_c: "C/C",
  cartridge_only: "Cartridge Only",
  doesnt_post: "Doesn't Post",
  with_cap_only: "With Cap Only",
  // Ink
  very_lubricated: "Very Lubricated",
  very_slow: "Very Slow",
  // Notebook
  dot_grid: "Dot Grid",
  perfect: "Perfect Bound",
  // Knife
  drop_point: "Drop Point",
  clip_point: "Clip Point",
  spear_point: "Spear Point",
  bead_blast: "Bead Blast",
  dlc: "DLC",
  slip_joint: "Slip Joint",
  bronze_washers: "Bronze Washers",
  caged_ball: "Caged Ball",
  razor_sharp: "Razor Sharp",
  needs_reprofile: "Needs Reprofile",
  // Flashlight
  ipx4: "IPX4",
  ipx7: "IPX7",
  ipx8: "IPX8",
  ip67: "IP67",
  ip68: "IP68",
  aa: "AA",
  aaa: "AAA",
  usb_c: "USB-C",
  // Audio
  iem: "IEM",
  dac_amp: "DAC/Amp",
  // Optic
  red_dot: "Red Dot",
  lpvo: "LPVO",
  // Medical
  ifak: "IFAK",
  // Misc
  dac: "DAC",
};

export function formatPickerLabel(value: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getItemLabel(item: {
  manufacturer?: string | null;
  model?: string | null;
  nickname?: string | null;
}): string {
  if (item.nickname) return item.nickname;
  const parts = [item.manufacturer, item.model]
    .filter(Boolean)
    .join(" ")
    .trim();
  return parts || "Unknown item";
}
