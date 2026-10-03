/* =====================================================================
 * 網站內容設定檔 — 改文字、換圖片只需要編輯這個檔案
 * ---------------------------------------------------------------------
 *  · 文字：直接修改引號內的內容。可用 <b>粗體</b>；[1]、[5][6] 會自動連到參考文獻。
 *  · 圖片：把圖檔上傳到 docs/images/，再把 src 改成 'images/檔名'。
 *          src 留空 ''，網站會顯示「待補」的虛線框。
 *  · 待補文字：以【待補】開頭的字串會顯示成虛線框，提醒尚未提供資料。
 *  · 資料來源：除特別標示外，內容皆引自書面報告 v29。
 * ===================================================================== */
window.SITE = {
  meta: {
    title: '主動式輪胎磨損微粒(TRWP)靜電捕捉裝置',
    short: 'TRWP Capture',
    group: '實作組-6',
    school: '中原大學 機械工程學系',
    schoolEn: 'Chung Yuan Christian University · Mechanical Engineering',
  },

  /* 1. 首頁 Hero */
  hero: {
    kicker: 'Active Electrostatic Capture of Tire & Road Wear Particles',
    title: '主動式輪胎磨損微粒(TRWP)<br>靜電捕捉裝置',
    summary: '以 15 kV 直流靜電場與平行銅板電極，主動捕集輪胎與路面磨損微粒；整合 48 V 輪轂馬達平台與雨滴感測自動斷電模組，無須使用濾網。',
    facts: [
      { v: '15 kV', k: '直流高壓電場' },
      { v: '17 mm', k: '銅板極板間距' },
      { v: '48 V', k: '輪轂馬達平台' },
      { v: 'SDG 3 · 11 · 9', k: '對應永續發展目標' },
    ],
    cta: '了解更多',
  },

  /* 2. 研究動機 */
  motivation: {
    impactTitle: 'TRWP 對環境的影響',
    impact: [
      '隨著電動車市佔率持續攀升，廢氣排放隨之減少；但電動車因電池質量增加與瞬間高扭力之特性，輪胎與路面磨損微粒(TRWP)之排放問題並未隨之改善[1][2]。',
      'OECD 評估指出，重型電動車之非廢氣 PM2.5 排放量較同級燃油車高約 3–8%，全球乘用車之非廢氣微粒排放總量預估至 2030 年將增加約 53.5%[3]。',
      'TRWP 佔全球初級微塑膠污染源的第二大宗[4]。其微粒含有防老劑 6PPD，氧化產物 6PPD-quinone(6PPD-Q) 隨雨水進入生態圈後，已證實對水生生物具急性毒性，且已於人體尿液中檢出[5][6]。',
    ],
    stats: [
      { v: '第二大宗', k: 'TRWP 於全球初級微塑膠污染源之排序[4]' },
      { v: '3–8%', k: '重型電動車非廢氣 PM2.5 較同級燃油車之增幅[3]' },
      { v: '53.5%', k: '全球乘用車非廢氣微粒排放至 2030 年之預估增幅[3]' },
    ],
    figure: { src: 'images/microplastic-sources.jpg', caption: '全球初級微塑膠排放來源比例（圖片來源：中央研究院提供，引自中時新聞網[14]；原始數據：Boucher 與 Friot[4]）' },
    whyTitle: '為何需要主動式收集',
    why: [
      { t: '傳統物理濾網', d: '會對車輛行進造成額外風阻，容易堵塞，並影響電動車續航里程[9][10]。' },
      { t: '被動式空氣動力學導流', d: '主要依賴微粒之慣性進行分離，對慣性小之細懸浮微粒(PM2.5)捕捉能力有限。' },
      { t: '主動式高壓靜電（本專題）', d: '無須濾網，利用庫侖力對輪胎揚塵進行物理定向分選與吸附，捕捉具導電性之細小 TRWP[12]。' },
    ],
    note: '目前國內外針對非廢氣排放微粒之研究多停留在法制研析與成分量測階段[7][8]；國際團隊 The Tyre Collective 已提出靜電捕捉概念並取得專利[11]，惟公開資料中較少完整之高壓電場流場驗證與模組化機構設計細節。',
    sdgs: [
      { n: 'SDG 3', t: '良好健康與福祉', d: '減少有害物質暴露所致之健康風險' },
      { n: 'SDG 11', t: '永續城市與社區', d: '改善都市空氣品質' },
      { n: 'SDG 9', t: '產業、創新與基礎建設', d: '解決手段屬產業技術創新' },
    ],
    sdgSource: '[13]',
  },

  /* 3. 系統架構 */
  system: {
    intro: '電源鏈路：110 V 市電經變壓器降壓至 12 V，依序通過保險絲、手動開關與繼電器(COM→NO)，再由升壓線圈提升至 15 kV 供電予銅板電極；雨滴感測器與 Arduino 構成獨立之低壓訊號迴路，經繼電器 IN 端控制高壓之通斷。',
    // 方塊圖：power = 高壓電力路徑；signal = 控制訊號路徑
    power: ['110 V AC 市電', '變壓器<br>110 V → 12 V', '保險絲 2 A', '手動開關', '繼電器<br>COM → NO', '升壓線圈<br>12 V → 15 kV', '銅板電極'],
    signal: ['雨滴感測器', 'Arduino Uno', '繼電器 IN'],
    parts: [
      { icon: 'motor', t: '輪轂馬達平台', en: 'Hub Motor', d: '48 V 輪轂馬達帶動測試輪胎(直徑約 50 cm)摩擦砂紙產生粉塵；最高轉速 350 RPM，約相當於 33 km/h 等效車速。', img: 'images/hub-motor.jpg' },
      { icon: 'power', t: '高壓電源', en: 'HV Power Supply', d: '110 V 轉 12 V 電源變壓器；12 V 輸出端依序串接 2 A 保險絲（過電流保護）與手動開關（人工總開關）。', img: 'images/components.jpg' },
      { icon: 'coil', t: '升壓線圈', en: 'Step-up Coil', d: '12 V 轉 15 kV 之直流高壓發生器；高壓端子壓接後以尼龍柱與螺帽鎖於銅片上。輸出電壓依模組規格標示，尚未以高壓探棒實測。', img: '' },
      { icon: 'plates', t: '銅板電極', en: 'Copper Plate Electrodes', d: '4 片平行銅片，極板間距 17 mm，以尼龍絕緣柱定距；外殼為 PLA 3D 列印，高壓接線端灌注熱熔膠絕緣封裝。', img: 'images/prototype.jpg' },
      { icon: 'rain', t: '雨滴感測自動斷電', en: 'Rain-sensing Cut-off', d: '偵測到降雨時自動切斷高壓電場；停雨後須經延遲時間方重新供電，避免殘留水氣造成誤動作。', img: 'images/rain-breadboard.jpg' },
      { icon: 'chip', t: 'Arduino 控制系統', en: 'Arduino Uno Control', d: '讀取雨滴感測器狀態並控制繼電器；採 NO 常開接點，Arduino 當機、斷電或訊號線鬆脫時高壓自動關閉(fail-safe)；手動開關具最高優先權。', img: 'images/rain-flow.png' },
    ],
    safety: {
      title: '安全模組驗收結果',
      rows: [['開機（乾燥狀態）', '繼電器通電，15 kV 正常運作', '通過'], ['偵測到降雨', '繼電器即時斷電', '通過'], ['停雨後延遲復電', '延遲時間內維持斷電，屆滿後恢復供電', '通過'], ['手動開關關閉之優先權', '無論感測器狀態，強制斷電', '設計成立']],
      note: '已於麵包板環境下以 Arduino Uno 完成低壓功能驗證；第四項屬電路拓樸特性，以電路設計之正確性為驗證依據。',
      figures: [
        { src: 'images/rain-circuit.png', caption: '雨滴感測器安全保護模組完整電路方塊圖' },
        { src: 'images/relay-no-nc.png', caption: '繼電器 NO／NC 接點選用理由之邏輯示意' },
      ],
    },
  },

  /* 4. 實驗與分析（三個分頁） */
  experiments: {
    intro: '效能驗證分為三階段：靜態封閉導流測試、動態摩擦測試與質譜化學鑑定。測試粉體以導電碳粉作為 TRWP 之替代品（主成分為碳黑類導電材料；粒徑分布與真實 TRWP 未必相同）。',
    tabs: [
      {
        key: 'inventor', t: 'Inventor 3D 圖', en: 'Autodesk Inventor',
        text: '以 Autodesk Inventor 進行 3D 建模，設計可搭載於輪轂馬達後方之外殼，機構設計主要考量氣流導引與高壓絕緣需求；並設計可抽取式集塵盒，極板匣可整組自外殼抽出。',
        figures: [
          { src: 'images/inventor-sketch.png', caption: '捕捉裝置設計草圖' },
          { src: 'images/inventor-dustbox.jpg', caption: '集塵盒回收機構設計圖（左：極板匣抽出狀態；右：組裝完成狀態）' },
          { src: '', caption: '【待補】Inventor 爆炸圖或組合渲染圖' },
        ],
      },
      {
        key: 'matlab', t: 'MATLAB 圖表', en: 'MATLAB Plots',
        text: '【待補】MATLAB 分析說明。下方暫放書面報告中的數據圖，若有 MATLAB 原始圖檔請替換。',
        figures: [
          { src: 'images/dynamic-mass.png', caption: '350 RPM 下各運轉時間三次測試之平均粉塵質量與捕捉裝置吸附質量（誤差棒為標準差；裝置位置：水平 25 cm）' },
          { src: 'images/core-area.png', caption: '核心面積隨 (a) 懸停高度與 (b) 懸停時間之變化趨勢' },
          { src: 'images/dust-envelope.png', caption: '粉塵雲上緣擴散包絡線與水平距離之關係（水平 30 cm 以內為示意）' },
        ],
      },
      {
        key: 'imagej', t: 'ImageJ 分析', en: 'ImageJ Analysis',
        text: '以開源影像分析軟體 ImageJ 對粉塵沉積圖案進行灰階閾值分割，量測核心面積、擴散半徑與質心偏移量，分別對應電場作用之強度、作用範圍與方向對稱性。以懸停高度 5 cm 為例，量得區域面積 45.999 cm²，擴散半徑取最大 Feret 直徑(8.109 cm)之一半。',
        figures: [
          { src: 'images/imagej.png', caption: 'ImageJ 影像分析流程（左：原始沉積影像；右：二值化影像；下：量測結果，以懸停高度 5 cm 為例）' },
        ],
        table: { head: ['懸停高度 (cm)', '核心面積 (cm²)', '擴散半徑 (cm)', '質心偏移量 (cm)'], rows: [['1', '144.27', '7.38', '0.45'], ['3', '83.30', '6.50', '0.53'], ['5', '46.00', '4.05', '0.25']] },
        after: '核心面積與擴散半徑均隨懸停高度增加而遞減，高度由 1 cm 增至 5 cm 時核心面積減少約 68%，與 E = V/d 所預期之電場強度隨間距增加而衰減之趨勢一致。',
      },
    ],
  },

  /* 5. 初步成果、限制與未來工作 */
  results: {
    badge: '初步量測',
    items: [
      { t: '模組製作與絕緣驗證', v: '15 kV', d: '高壓電源鏈路於空載與載入極板下均正常運作；17 mm 極板間距於振動測試後未位移；振動測試與動態運轉期間未觀察到沿面漏電或極板跳火。', tag: '' },
      { t: '靜態捕捉效率', v: '0.72% → 16.29%', d: '封閉導流測試中，電場關閉(n=3)為 0.72%，開啟 15 kV(n=5)為 16.29%；電場關閉三次均不高於 1.00%，開啟五次介於 9.00%–21.00%，兩組數值範圍沒有重疊。電場關閉之 0.72% 為天平量測下限。', tag: '初步量測' },
      { t: '粉塵擴散範圍', v: '0–73 cm', d: '350 RPM 下，粉塵擴散區域為水平 0–73 cm，沉積量最多處位於 27 cm（寬約 21 cm），最大飛散高度約 14 cm；裝置依此放置於水平 25 cm 處。', tag: '' },
      { t: '動態捕捉效率', v: '約 28%', d: '僅於輪轂馬達最高轉速 350 RPM 單一轉速下測試，10／20／30 秒各重複 3 次，平均約 27.6%。吸附質量僅 0.002–0.005 g，讀值誤差約佔 10–25%，現階段僅能說明效率約落於二至三成之間。', tag: '初步量測・單一轉速' },
      { t: '質譜化學鑑定', v: '疑似 6PPD', d: '兩組樣品（砂紙直接磨耗之輪胎粉塵、本裝置集塵盒收集之粉塵）於 m/z 268 皆出現與 6PPD 理論質量相符之訊號（質量誤差 2.98／1.49 ppm）；惟 M+1 峰強度比高於理論值，且尚無 6PPD 標準品比對，<b>僅為訊號相符，尚未確認</b>。', tag: '訊號相符・待確認' },
    ],
    msTable: { head: ['樣品', '來源', 'm/z 實測 (Da)', '質量誤差'], rows: [['樣品 1', '砂紙直接磨耗之輪胎粉塵（未經裝置）', '268.1926', '2.98 ppm'], ['樣品 2', '本裝置集塵盒所收集之粉塵', '268.1930', '1.49 ppm']], note: '6PPD(C₁₈H₂₄N₂) 理論精確質量 268.1934 Da。' },
    msFigures: [
      { src: 'images/ms-sample1.png', caption: '樣品 1 質譜圖（上：全圖；下：m/z 268 附近放大並與 6PPD 理論同位素分布比對）' },
      { src: 'images/ms-sample2.png', caption: '樣品 2 質譜圖（上：全圖；下：m/z 268 附近放大並與 6PPD 理論同位素分布比對）' },
    ],
    limits: [
      '動態測試受限於輪轂馬達最高轉速(350 RPM)與變壓器負載能力，僅完成單一轉速測試，各條件僅重複三次。',
      '捕捉裝置吸附質量僅 0.002–0.005 g，約為天平解析度(0.001 g)之 2–5 倍，統計代表性仍待強化。',
      '動態測試於開放環境中進行且未加裝導流罩。',
      '替代粉體僅使用導電碳粉，尚未取得對絕緣性微粒之選擇性捕捉證據。',
      '質譜鑑定尚缺 6PPD 標準品比對，僅分析兩個樣品，M+1 峰強度比與理論值不符，亦未定量 6PPD 含量。',
      '升壓模組輸出電壓係依製造商標示規格(15 kV)，未以高壓探棒實測。',
    ],
    future: [
      '取得負載能力更高之電源與馬達設備後，完成多組轉速之捕捉效率量測，建立效率與等效車速之關係曲線。',
      '依擴散包絡線以兩階段最佳化（先掃水平距離、再掃垂直高度）尋找最佳裝置放置位置。',
      '延長單次運轉時間或增加重複次數，降低相對量測誤差並強化統計代表性。',
      '比較不同砂紙目數與柏油之產塵特性；擴大樣品數並取得 6PPD 標準品比對，嘗試建立同位素稀釋定量方法。',
      '導入絕緣性替代粉體作為對照組，驗證裝置對導電微粒之選擇性捕捉能力。',
      '於裝置前端加裝導流罩並納入動態摩擦測試，比較加裝前後之收集效率。',
    ],
  },

  /* 6. 團隊與指導教授 */
  team: {
    advisor: { name: '杜哲怡', title: '指導教授', unit: '【待補】系所與職稱', photo: '', note: '' },
    members: [
      { name: '陳睿瑀', role: '專題生', photo: '', work: '3D CAD 模型設計與建模、高壓電路與雨滴感測器模組之電路設計與程式實作、實驗設計、數據分析、統整專題書面報告。' },
      { name: '林子鈞', role: '專題生', photo: '', work: '查閱 6PPD 採集與檢測相關文獻、測試流程擬定、樣品採集、質譜儀檢測結果統整與分析。' },
      { name: '李恩', role: '專題生', photo: '', work: '輪轂馬達模組之架設、實驗器材之設計與組裝、電路佈線與焊接、系統絕緣與防漏電工程實作。' },
    ],
    thanks: '感謝中原大學化學系蔡祐輔教授於質譜鑑定階段提供 Bruker micrOTOF II 高解析飛行時間質譜儀。',
  },

  /* 7. 參考文獻（IEEE 格式；編號與書面報告一致） */
  references: [
    'F. Sommer et al., "Tire abrasion as a major source of microplastics in the environment," <i>Aerosol Air Qual. Res.</i>, vol. 18, no. 8, pp. 2014–2028, 2018.',
    'T. De Oliveira et al., "Realistic assessment of tire and road wear particle emissions and their influencing factors on different types of roads," <i>J. Hazard. Mater.</i>, vol. 446, p. 130752, 2023.',
    'OECD, <i>Non-exhaust Particulate Emissions from Road Transport: An Ignored Environmental Policy Challenge</i>. Paris, France: OECD Publishing, 2020, doi: 10.1787/4a4dc6ca-en.',
    'J. Boucher and D. Friot, "Primary microplastics in the oceans: A global evaluation of sources," IUCN, Gland, Switzerland, 2017, doi: 10.2305/IUCN.CH.2017.01.en.',
    'B. Du, B. Liang, Y. Li, M. Shen, L.-Y. Liu, and L. Zeng, "First report on the occurrence of N-(1,3-dimethylbutyl)-N′-phenyl-p-phenylenediamine (6PPD) and 6PPD-quinone as pervasive pollutants in human urine from South China," <i>Environ. Sci. Technol. Lett.</i>, vol. 9, no. 12, pp. 1056–1062, 2022.',
    'Z. Tian, H. Zhao, K. T. Peter et al., "A ubiquitous tire rubber-derived chemical induces acute mortality in coho salmon," <i>Science</i>, vol. 371, no. 6525, pp. 185–189, 2021.',
    '林淑靜, "車輛非廢氣排放顆粒之法制問題研析," 立法院, 台北, 台灣, 議題研析 R02674, 2025.',
    'EARPA, "Non-Exhaust particle emissions – Gaps and research needs," EARPA, Brussels, Belgium, Position Paper, 2026.',
    'DEFRA, "Review of PM2.5 reduction technologies for on road transport," Dept. Environ., Food Rural Affairs, London, U.K., Tech. Rep., 2025.',
    'POLIS Network, "Review: Mitigation measures to reduce tire and road wear particles," POLIS Network, Brussels, Belgium, Tech. Rep., 2023.',
    'C. P. H. Cheng, H. Richardson, S. L. Anderson, and M. D. Mallya, "Particulate collecting device," WIPO Patent WO2021152331A1, Aug. 5, 2021.',
    '周士傑, "靜電除塵器(EP)電場作用下之粉塵行徑模式研究," 碩士論文, 工程科學系專班, 國立成功大學, 台南, 台灣, 2010.',
    'United Nations, <i>Transforming Our World: The 2030 Agenda for Sustainable Development</i>. New York, NY, USA: United Nations, 2015.',
    '梁惠明, "中研院新研究：微塑膠愈小愈毒 毒性影響後代繁衍," 中時新聞網, 2020年12月5日. [Online]. Available: https://www.chinatimes.com/realtimenews/20201205001504-260418',
    'R. F. Lane et al., "Tire-derived contaminants 6PPD and 6PPD-Q: Analysis, sample handling, and reconnaissance of United States stream exposures," <i>Chemosphere</i>, vol. 363, p. 142830, 2024.',
    'H. N. Zhao et al., "Transformation products of tire rubber antioxidant 6PPD in heterogeneous gas-phase ozonation: Identification and environmental occurrence," <i>Environ. Sci. Technol.</i>, vol. 57, no. 14, pp. 5621–5632, 2023.',
    'U.S. Environmental Protection Agency, "Draft Method 1634: Determination of 6PPD-quinone in aqueous matrices using liquid chromatography with tandem mass spectrometry (LC/MS/MS)," EPA 821-D-24-001, 2024.',
    'U.S. Environmental Protection Agency, "Air pollution control technology fact sheet: Dry electrostatic precipitator (ESP)—Wire-plate type," EPA-452/F-03-028, 2003.',
    'Imperial College London, "World\'s first device to capture harmful tyre particles invented by students," Imperial News, London, U.K., Mar. 2020.',
    'Advanced Propulsion Centre UK, "The Tyre Collective: Old tyre, new tyre: Why each tyre\'s journey is never done," APC Impact Case Study, 2025.',
    'European Parliament and Council of the European Union, "Regulation (EU) 2024/1257 on type-approval of motor vehicles and engines and of systems, components and separate technical units intended for such vehicles, with respect to their emissions and battery durability (Euro 7)," <i>Off. J. Eur. Union</i>, 2024.',
    'California Department of Toxic Substances Control, "Product–chemical profile for motor vehicle tires containing N-(1,3-dimethylbutyl)-N′-phenyl-p-phenylenediamine (6PPD)," Discussion Draft, Sacramento, CA, USA, 2021.',
  ],
};
