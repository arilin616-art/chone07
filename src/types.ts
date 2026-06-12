export interface RecitationRecord {
  id?: string;
  userId?: string | null;
  reporterName: string;
  sutraId: string;
  sutraName: string;
  count: number;
  dedication: string;
  timestamp: any; // Firestore Timestamp or Date object representation
}

export interface SutraTotal {
  sutraId: string;
  sutraName: string;
  totalCount: number;
  lastUpdatedAt: any;
}

export interface SutraCatalogItem {
  id: string;
  name: string;
  category: "sutra" | "mantra" | "buddha_name";
  defaultDedication: string;
  pinyinName?: string;
}

export type WishType = "health" | "ancestors" | "career" | "peace";

export const SUTRA_CATALOG: SutraCatalogItem[] = [
  {
    id: "heart_sutra",
    name: "般若波羅蜜多心經",
    category: "sutra",
    defaultDedication: "願以此般若波羅蜜多心經功德，開顯智悲、消弭煩惱、身心安定、吉祥如意。"
  },
  {
    id: "compassion_mantra",
    name: "大悲咒",
    category: "mantra",
    defaultDedication: "願以此大悲大咒功德，慈悲覆護、病障消退、消災避難、萬事咸熙。"
  },
  {
    id: "amitabha",
    name: "阿彌陀佛聖號",
    category: "buddha_name",
    defaultDedication: "願以此念佛功德，莊嚴佛土、臨終自得、承佛引導、得生西方蓮邦。"
  },
  {
    id: "avalokiteshvara",
    name: "觀世音菩薩聖號",
    category: "buddha_name",
    defaultDedication: "願以此持誦大悲圓通觀音名號功德，聞聲救苦、災難消除、闔家安康、隨願成就。"
  },
  {
    id: "medicine_buddha_mantra",
    name: "藥師灌頂真言",
    category: "mantra",
    defaultDedication: "願以此持誦藥師灌頂真言功德，迴向親眷、身心安和、消除諸病、延壽增福。"
  },
  {
    id: "diamond_sutra",
    name: "金剛般若波羅蜜經",
    category: "sutra",
    defaultDedication: "願以此金剛經持誦功德，破除執著、無我相人相、開大智慧、業消福隆。"
  },
  {
    id: "ksitigarbha_sutra",
    name: "地藏菩薩本願經",
    category: "sutra",
    defaultDedication: "願以此地藏經功德，消解多生冤親債主、超拔歷代先祖、闔家和睦、安樂豐足。"
  },
  {
    id: "shurangama_mantra",
    name: "楞嚴神咒",
    category: "mantra",
    defaultDedication: "願以此楞嚴大咒神力功德，辟除一切外道妖魔障礙、防護心識、不墮邪網、速証圓通。"
  },
  {
    id: "cundi_mantra",
    name: "準提神咒",
    category: "mantra",
    defaultDedication: "願以此準提佛母神咒功德，求財得財、求子得子、福祿廣進、心願皆圓。"
  },
  {
    id: "six_words",
    name: "六字大明咒 (唵嘛呢叭咪吽)",
    category: "mantra",
    defaultDedication: "願以此觀音六字真言功德，消除六道苦因、智慧清淨、福德無量。"
  },
  {
    id: "rebirth_mantra",
    name: "往生淨土神咒",
    category: "mantra",
    defaultDedication: "願以此持誦往生咒功德，拔除一切業障根本，得生淨土上品上生。"
  }
];
