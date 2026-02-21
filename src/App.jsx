import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const ET = {
  foundational:{label:"Foundational",color:"#E8A838",dash:null,group:"academic"},
  extends:{label:"Extends",color:"#9b7ed4",dash:null,group:"academic"},
  challenges:{label:"Challenges",color:"#D45B5B",dash:"6,3",group:"academic"},
  applies:{label:"Applies / Tests",color:"#5BD4A3",dash:null,group:"academic"},
  enables:{label:"Enables",color:"#7BAFD4",dash:"3,3",group:"academic"},
  case_of:{label:"Case study of",color:"#D4A85B",dash:"8,4",group:"academic"},
  causes:{label:"Causal link",color:"#888",dash:"2,4",group:"academic"},
  // War Room
  activates:{label:"Activates",color:"#00E5FF",dash:null,group:"warroom"},
  blocks:{label:"Blocks",color:"#FF1744",dash:"4,2",group:"warroom"},
  relaxes:{label:"Relaxes",color:"#76FF03",dash:null,group:"warroom"},
};
const TIERS={spine:{label:"Canonical Spine",r:16,op:0.95,sw:2.2},frontier:{label:"Research Frontier",r:11,op:0.8,sw:1.5},supporting:{label:"Supporting",r:8,op:0.55,sw:1}};
const DOM={
  growth:{label:"Growth Theory",color:"#E8A838"},struct:{label:"Structural Transformation",color:"#5BD45B"},
  inst:{label:"Institutions & Pol. Economy",color:"#D45B5B"},trade:{label:"Trade & Globalization",color:"#5BA3D4"},
  tech:{label:"Technology & Innovation",color:"#D4A85B"},human:{label:"Human Capital & Demographics",color:"#9b7ed4"},
  state:{label:"State & Industrial Policy",color:"#D45B99"},env:{label:"Environment & Sustainability",color:"#4CAF50"},
  finance:{label:"Finance & Crises",color:"#FF7043"},social:{label:"Culture & Social Capital",color:"#AB47BC"},
};

const concepts=[
  {id:"c_growth",label:"Growth\nTheory",desc:"Accounting, endogenous growth, diagnostics, and the middle-income trap.",domain:"growth"},
  {id:"c_struct",label:"Structural\nTransformation",desc:"Reallocation from agriculture to industry and services.",domain:"struct"},
  {id:"c_inst",label:"Institutions\n& History",desc:"Property rights, rule of law, political economy, colonial legacies, and deep determinants.",domain:"inst"},
  {id:"c_indpol",label:"Industrial\nPolicy",desc:"Government intervention to accelerate industrialization.",domain:"state"},
  {id:"c_devstate",label:"Developmental\nState",desc:"Bureaucratic capacity and embedded autonomy enabling effective intervention.",domain:"state"},
  {id:"c_trade",label:"Trade &\nIntegration",desc:"Export-led growth, FDI spillovers, and world market integration.",domain:"trade"},
  {id:"c_tech",label:"Technology &\nFuture",desc:"How frontier technologies spread, and whether growth miracles can still happen under automation and climate change.",domain:"tech"},
  {id:"c_human",label:"Human\nCapital",desc:"Education, skills, health as drivers of productivity.",domain:"human"},
  {id:"c_demog",label:"Demographic\nDividend",desc:"Population structure interacting with growth.",domain:"human"},
  {id:"c_infra",label:"Infrastructure\n& Linkages",desc:"Physical and social infrastructure, coordination problems, linkages.",domain:"struct"},
  {id:"c_social",label:"Social Capital\n& Trust",desc:"Trust, civic norms, fractionalization, and collective action.",domain:"social"},
  {id:"c_env",label:"Environment\n& Growth",desc:"Environmental Kuznets Curve and sustainability constraints.",domain:"env"},
  {id:"c_finance",label:"Financial\nDevelopment",desc:"Financial systems, credit allocation, and crisis vulnerability.",domain:"finance"},
];

// WAR ROOM: POLICY LEVERS
const levers = [
  {id:"l_export_sub",label:"Export\nSubsidies",desc:"Direct and indirect incentives for firms to export: tax rebates, subsidized shipping.",type:"lever"},
  {id:"l_dir_credit",label:"Directed\nCredit",desc:"State-controlled allocation of cheap capital to priority sectors.",type:"lever"},
  {id:"l_sez",label:"Special Econ\nZones",desc:"Zones with reduced regulation and tax holidays to attract FDI.",type:"lever"},
  {id:"l_tvet",label:"Vocational\nTraining",desc:"State investment in technical education to build absorptive capacity.",type:"lever"},
  {id:"l_procurement",label:"Public\nProcurement",desc:"Government purchasing to create guaranteed demand for domestic firms.",type:"lever"},
  {id:"l_exchange",label:"FX\nUndervaluation",desc:"Maintaining a competitive real exchange rate for export advantage.",type:"lever"},
  {id:"l_infra_grant",label:"Matching\nInfra Grants",desc:"Conditional infrastructure transfers requiring community co-investment (e.g. Saemaul cement).",type:"lever"},
  {id:"l_land_reform",label:"Land\nReform",desc:"Redistribution of agricultural land to raise rural productivity.",type:"lever"},
  {id:"l_import_prot",label:"Infant Industry\nProtection",desc:"Temporary tariffs to shield nascent domestic industries.",type:"lever"},
];
// WAR ROOM: CONSTRAINTS
const wrConstraints = [
  {id:"b_fx",label:"FX\nFragility",desc:"Vulnerability to sudden capital outflows and currency crises.",type:"constraint"},
  {id:"b_fiscal",label:"Low Fiscal\nCapacity",desc:"Inability to raise sufficient tax revenue for public investment.",type:"constraint"},
  {id:"b_trust",label:"Low Social\nTrust",desc:"Weak civic norms preventing collective action and cooperation.",type:"constraint"},
  {id:"b_info",label:"Information\nExternalities",desc:"Firms can't capture returns from discovering what's profitable.",type:"constraint"},
  {id:"b_coord",label:"Coordination\nFailure",desc:"Complementary investments won't happen individually.",type:"constraint"},
  {id:"b_skills",label:"Low Firm\nCapability",desc:"Firms lack managerial know-how or technical skills.",type:"constraint"},
  {id:"b_corruption",label:"Weak\nBureaucracy",desc:"State agents lack competence or autonomy; captured by rent-seekers.",type:"constraint"},
  {id:"b_elite",label:"Elite\nCapture",desc:"Extractive elites block reforms threatening their rents.",type:"constraint"},
];
// COUNTRY SPRINT LOOKUP
const countryLevers = {
  Korea:["l_export_sub","l_dir_credit","l_tvet","l_infra_grant","l_land_reform","l_import_prot"],
  Taiwan:["l_dir_credit","l_export_sub","l_sez","l_land_reform"],
  China:["l_sez","l_dir_credit","l_exchange","l_import_prot"],
  "Costa Rica":["l_sez","l_tvet"],Bangladesh:["l_sez","l_exchange"],
  Singapore:["l_sez","l_tvet","l_exchange"],Japan:["l_dir_credit","l_import_prot","l_procurement"],
  Argentina:["l_import_prot","l_exchange"],Indonesia:["l_sez","l_import_prot"],
  Brazil:["l_import_prot","l_dir_credit","l_land_reform"],Egypt:["l_export_sub","l_sez"],
  Mexico:["l_sez","l_exchange"],Rwanda:["l_procurement","l_infra_grant"],
  India:["l_import_prot","l_sez","l_dir_credit","l_procurement"],
  Kenya:["l_sez","l_infra_grant"],
  "South Africa":["l_tvet","l_sez","l_procurement"],
  Peru:["l_sez","l_exchange"],
  Thailand:["l_sez","l_export_sub","l_exchange","l_dir_credit"],
  Pakistan:["l_sez","l_exchange"],
  Vietnam:["l_sez","l_exchange","l_land_reform","l_export_sub","l_tvet"],
  Nigeria:["l_sez","l_import_prot","l_exchange"],
  Ethiopia:["l_sez","l_dir_credit","l_infra_grant","l_import_prot"],
  Malaysia:["l_sez","l_dir_credit","l_tvet","l_export_sub"],
  Chile:["l_exchange","l_export_sub"],
};
const countryConstraints = {
  Korea:["b_skills","b_coord"],Taiwan:["b_coord","b_info"],China:["b_corruption","b_coord"],
  "Costa Rica":["b_skills","b_info"],Bangladesh:["b_fiscal","b_skills","b_trust"],
  Singapore:["b_info"],Japan:["b_coord"],Argentina:["b_fx","b_fiscal","b_elite"],
  Indonesia:["b_corruption","b_skills"],Brazil:["b_fx","b_elite","b_corruption"],
  India:["b_coord","b_corruption","b_skills"],Peru:["b_elite","b_trust"],
  Kenya:["b_trust","b_corruption","b_fiscal"],
  "South Africa":["b_skills","b_elite","b_coord"],
  Rwanda:["b_trust","b_fiscal"],
  Mexico:["b_corruption","b_elite","b_fx"],
  Egypt:["b_corruption","b_elite","b_fiscal"],
  Thailand:["b_corruption","b_coord","b_fx"],
  Pakistan:["b_elite","b_corruption","b_fiscal","b_trust"],
  Vietnam:["b_skills","b_corruption","b_info"],
  Nigeria:["b_corruption","b_elite","b_fiscal","b_trust","b_fx"],
  Ethiopia:["b_fiscal","b_skills","b_trust","b_info"],
  Malaysia:["b_elite","b_coord"],
  Chile:["b_elite","b_info","b_coord"],
};
// WAR ROOM EDGES
const warEdges = [
  {s:"l_export_sub",t:"c_trade",type:"activates",note:"Subsidies push firms into export markets"},
  {s:"l_dir_credit",t:"c_indpol",type:"activates",note:"Cheap capital enables state to fund priority sectors"},
  {s:"l_dir_credit",t:"c_finance",type:"activates",note:"Policy lending mobilizes savings toward investment"},
  {s:"l_sez",t:"c_trade",type:"activates",note:"Tax-free zones attract MNCs and create export platforms"},
  {s:"l_tvet",t:"c_human",type:"activates",note:"Vocational training builds absorptive capacity"},
  {s:"l_procurement",t:"c_indpol",type:"activates",note:"Guaranteed demand creates scale for infant industries"},
  {s:"l_exchange",t:"c_trade",type:"activates",note:"Cheap currency makes exports competitive"},
  {s:"l_infra_grant",t:"c_infra",type:"activates",note:"Conditional grants build roads while requiring community buy-in"},
  {s:"l_infra_grant",t:"c_social",type:"activates",note:"Co-investment builds social capital through collective action"},
  {s:"l_land_reform",t:"c_struct",type:"activates",note:"Redistribution raises ag productivity and frees labor"},
  {s:"l_import_prot",t:"c_indpol",type:"activates",note:"Tariff wall gives firms space to learn"},
  {s:"b_fx",t:"c_finance",type:"blocks",note:"Currency crises destroy savings and investment"},
  {s:"b_fx",t:"c_trade",type:"blocks",note:"Volatile FX deters long-term export investment"},
  {s:"b_fiscal",t:"c_indpol",type:"blocks",note:"No revenue = no policy tools"},
  {s:"b_fiscal",t:"c_devstate",type:"blocks",note:"Can't build bureaucracy without fiscal resources"},
  {s:"b_trust",t:"c_social",type:"blocks",note:"Low trust prevents cooperation for collective goods"},
  {s:"b_trust",t:"c_infra",type:"blocks",note:"Communities can't coordinate shared infrastructure"},
  {s:"b_info",t:"c_tech",type:"blocks",note:"Firms won't experiment without appropriable returns"},
  {s:"b_info",t:"c_trade",type:"blocks",note:"Nobody knows what's profitable to export"},
  {s:"b_coord",t:"c_struct",type:"blocks",note:"Complementary investments stall without coordination"},
  {s:"b_coord",t:"c_infra",type:"blocks",note:"Infrastructure needs simultaneous investment"},
  {s:"b_skills",t:"c_tech",type:"blocks",note:"Firms can't absorb technology they lack capacity for"},
  {s:"b_skills",t:"c_trade",type:"blocks",note:"Can't meet export standards without skills"},
  {s:"b_corruption",t:"c_devstate",type:"blocks",note:"Captured bureaucracy can't implement policy"},
  {s:"b_corruption",t:"c_indpol",type:"blocks",note:"Subsidies go to cronies, not productive firms"},
  {s:"b_elite",t:"c_inst",type:"blocks",note:"Elites block institutional reform"},
  {s:"b_elite",t:"c_struct",type:"blocks",note:"Creative destruction requires losers; elites prevent it"},
  {s:"l_dir_credit",t:"b_info",type:"relaxes",note:"State absorbs discovery costs"},
  {s:"l_dir_credit",t:"b_coord",type:"relaxes",note:"Coordinated lending solves simultaneous investment"},
  {s:"l_sez",t:"b_coord",type:"relaxes",note:"Zones bundle infrastructure + regulation"},
  {s:"l_sez",t:"b_skills",type:"relaxes",note:"MNC presence transfers technology and management"},
  {s:"l_tvet",t:"b_skills",type:"relaxes",note:"Training directly addresses capability gap"},
  {s:"l_infra_grant",t:"b_trust",type:"relaxes",note:"Community grants build trust through repeated cooperation"},
  {s:"l_infra_grant",t:"b_coord",type:"relaxes",note:"State provides cement, village provides labor"},
  {s:"l_land_reform",t:"b_elite",type:"relaxes",note:"Redistribution breaks landlord power"},
  {s:"l_export_sub",t:"b_info",type:"relaxes",note:"Subsidized exporting reveals comparative advantage"},
  {s:"l_procurement",t:"b_coord",type:"relaxes",note:"Guaranteed demand de-risks investment"},
  {s:"l_import_prot",t:"b_skills",type:"relaxes",note:"Temporary protection gives time to build capability"},
];

const papers=[
  // ═══ CANONICAL SPINE ═══
  {id:"solow57",short:"Solow 1957",full:"Solow (1957). Technical Change and the Aggregate Production Function. Rev Econ Stat.",tier:"spine",domain:"growth",cases:[],yr:1957},
  {id:"halljones99",short:"Hall & Jones 1999",full:"Hall & Jones (1999). Why Do Some Countries Produce So Much More? QJE.",tier:"spine",domain:"growth",cases:[],yr:1999},
  {id:"ajr01",short:"AJR 2001",full:"Acemoglu, Johnson & Robinson (2001). Colonial Origins. AER.",tier:"spine",domain:"inst",cases:[],yr:2001},
  {id:"north91",short:"North 1991",full:"North (1991). Institutions. JEP.",tier:"spine",domain:"inst",cases:[],yr:1991},
  {id:"lewis54",short:"Lewis 1954",full:"Lewis (1954). Economic Development with Unlimited Supplies of Labour. Manchester School.",tier:"spine",domain:"struct",cases:[],yr:1954},
  {id:"mcmrodrik11",short:"McMillan & Rodrik 2011",full:"McMillan & Rodrik (2011). Globalization, Structural Change and Productivity. NBER.",tier:"spine",domain:"struct",cases:[],yr:2011},
  {id:"hrv05",short:"HRV 2005",full:"Hausmann, Rodrik & Velasco (2005). Growth Diagnostics.",tier:"spine",domain:"growth",cases:[],yr:2005},
  {id:"amsden89",short:"Amsden 1989",full:"Amsden (1989). Asia's Next Giant: South Korea. Oxford UP.",tier:"spine",domain:"state",cases:["Korea"],yr:1989},
  {id:"evans95",short:"Evans 1995",full:"Evans (1995). Embedded Autonomy. Princeton UP.",tier:"spine",domain:"state",cases:["Korea","Brazil"],yr:1995},
  {id:"lane22",short:"Lane 2022",full:"Lane (2022). Manufacturing Revolutions: Industrial Policy in South Korea. QJE.",tier:"spine",domain:"state",cases:["Korea"],yr:2022},
  {id:"melitz03",short:"Melitz 2003",full:"Melitz (2003). Impact of Trade on Intra-Industry Reallocations. Econometrica.",tier:"spine",domain:"trade",cases:[],yr:2003},
  {id:"atkin17exp",short:"Atkin et al. 2017 (Export)",full:"Atkin et al. (2017). Exporting and Firm Performance: An RCT. QJE.",tier:"spine",domain:"trade",cases:["Egypt"],yr:2017},
  {id:"javorcik04",short:"Javorcik 2004",full:"Javorcik (2004). Does FDI Increase Domestic Firm Productivity? AER.",tier:"spine",domain:"trade",cases:["Vietnam"],yr:2004},
  {id:"moscona23",short:"Moscona & Sastry 2023",full:"Moscona & Sastry (2023). Inappropriate Technology. AER.",tier:"spine",domain:"tech",cases:[],yr:2023},
  {id:"hsiehklenow09",short:"Hsieh & Klenow 2009",full:"Hsieh & Klenow (2009). Misallocation and Manufacturing TFP. QJE.",tier:"spine",domain:"struct",cases:["China","India"],yr:2009},
  {id:"reinhart09",short:"Reinhart & Rogoff 2009",full:"Reinhart & Rogoff (2009). This Time Is Different. Princeton UP.",tier:"spine",domain:"finance",cases:["Argentina"],yr:2009},
  {id:"rodrik16",short:"Rodrik 2016",full:"Rodrik (2016). Premature Deindustrialization. J Econ Growth.",tier:"spine",domain:"growth",cases:["India","Brazil","Nigeria"],yr:2016},
  {id:"gk95",short:"Grossman & Krueger 1995",full:"Grossman & Krueger (1995). Economic Growth and the Environment. QJE.",tier:"spine",domain:"env",cases:[],yr:1995},
  {id:"ar12",short:"Acemoglu & Robinson 2012",full:"Acemoglu & Robinson (2012). Why Nations Fail. Crown.",tier:"spine",domain:"inst",cases:["Argentina"],yr:2012},
  {id:"pritchett00",short:"Pritchett 2000",full:"Pritchett (2000). Understanding Patterns of Economic Growth. WB Econ Rev.",tier:"spine",domain:"growth",cases:[],yr:2000},
  {id:"hirschman58",short:"Hirschman 1958",full:"Hirschman (1958). The Strategy of Economic Development. Yale UP.",tier:"spine",domain:"struct",cases:[],yr:1958},
  {id:"bloomwilliamson98",short:"Bloom & Williamson 1998",full:"Bloom & Williamson (1998). Demographic Transitions and Miracles. WB Econ Rev.",tier:"spine",domain:"human",cases:["Korea","Taiwan","Singapore","Thailand","Malaysia","Vietnam"],yr:1998},
  {id:"hanushek12",short:"Hanushek & Woessmann 2012",full:"Hanushek & Woessmann (2012). Do Better Schools Lead to More Growth? J Econ Growth.",tier:"spine",domain:"human",cases:[],yr:2012},
  {id:"romer90",short:"Romer 1990",full:"Romer (1990). Endogenous Technological Change. JPE.",tier:"spine",domain:"growth",cases:[],yr:1990},
  {id:"mankiw92",short:"Mankiw, Romer & Weil 1992",full:"Mankiw, Romer & Weil (1992). Contribution to the Empirics of Economic Growth. QJE.",tier:"spine",domain:"growth",cases:[],yr:1992},
  {id:"barro91",short:"Barro 1991",full:"Barro (1991). Economic Growth in a Cross Section of Countries. QJE.",tier:"spine",domain:"growth",cases:[],yr:1991},
  {id:"gerschenkron62",short:"Gerschenkron 1962",full:"Gerschenkron (1962). Economic Backwardness in Historical Perspective. Harvard UP.",tier:"spine",domain:"growth",cases:[],yr:1962},
  {id:"johnson82",short:"Johnson 1982",full:"Johnson (1982). MITI and the Japanese Miracle. Stanford UP.",tier:"spine",domain:"state",cases:["Japan"],yr:1982},
  {id:"nunn08",short:"Nunn 2008",full:"Nunn (2008). The Long-Term Effects of Africa's Slave Trades. QJE.",tier:"spine",domain:"inst",cases:["Nigeria","Kenya"],yr:2008},
  {id:"banerjeeduflo05",short:"Banerjee & Duflo 2005",full:"Banerjee & Duflo (2005). Growth Theory through the Lens of Development. Handbook.",tier:"spine",domain:"growth",cases:[],yr:2005},
  {id:"easterly97",short:"Easterly & Levine 1997",full:"Easterly & Levine (1997). Africa's Growth Tragedy. QJE.",tier:"spine",domain:"social",cases:[],yr:1997},
  {id:"alesina03",short:"Alesina et al. 2003",full:"Alesina et al. (2003). Fractionalization. J Econ Growth.",tier:"spine",domain:"social",cases:[],yr:2003},
  {id:"sachs03",short:"Sachs 2003",full:"Sachs (2003). Institutions Don't Rule. NBER.",tier:"spine",domain:"inst",cases:[],yr:2003},
  {id:"dell10",short:"Dell 2010",full:"Dell (2010). Persistent Effects of Peru's Mining Mita. Econometrica.",tier:"spine",domain:"inst",cases:["Peru"],yr:2010},
  {id:"song11",short:"Song, Storesletten & Zilibotti 2011",full:"Song et al. (2011). Growing Like China. AER.",tier:"spine",domain:"struct",cases:["China"],yr:2011},
  {id:"rodrik04",short:"Rodrik, Subramanian & Trebbi 2004",full:"Rodrik et al. (2004). Institutions Rule. J Econ Growth.",tier:"spine",domain:"inst",cases:[],yr:2004},
  // New spine
  {id:"ostrom90",short:"Ostrom 1990",full:"Ostrom (1990). Governing the Commons. Cambridge UP.",tier:"spine",domain:"inst",cases:[],yr:1990},
  {id:"herrendorf14",short:"Herrendorf et al. 2014",full:"Herrendorf et al. (2014). Growth and Structural Transformation. Handbook of Econ Growth.",tier:"spine",domain:"struct",cases:[],yr:2014},
  {id:"guiso06",short:"Guiso et al. 2006",full:"Guiso, Sapienza & Zingales (2006). Does Culture Affect Economic Outcomes? JEP.",tier:"spine",domain:"social",cases:[],yr:2006},
  {id:"harrison10",short:"Harrison & Rodriguez-Clare 2010",full:"Harrison & Rodriguez-Clare (2010). Trade, FDI, and Industrial Policy. Handbook of Dev Econ.",tier:"spine",domain:"trade",cases:[],yr:2010},

  // ═══ FRONTIER ═══
  {id:"rodrik95",short:"Rodrik 1995",full:"Rodrik (1995). Getting Interventions Right: Korea and Taiwan. Econ Policy.",tier:"frontier",domain:"state",cases:["Korea","Taiwan"],yr:1995},
  {id:"heath15",short:"Heath & Mobarak 2015",full:"Heath & Mobarak (2015). Manufacturing Growth and Bangladeshi Women. J Dev Econ.",tier:"frontier",domain:"trade",cases:["Bangladesh"],yr:2015},
  {id:"atkin17soccer",short:"Atkin et al. 2017 (Soccer)",full:"Atkin et al. (2017). Organizational Barriers: Soccer-Ball Producers. QJE.",tier:"frontier",domain:"tech",cases:["Pakistan"],yr:2017},
  {id:"bloom13",short:"Bloom et al. 2013",full:"Bloom et al. (2013). Does Management Matter? India. QJE.",tier:"frontier",domain:"tech",cases:["India"],yr:2013},
  {id:"alfaro22",short:"Alfaro-Urena et al. 2022",full:"Alfaro-Urena et al. (2022). Joining Multinational Supply Chains. QJE.",tier:"frontier",domain:"trade",cases:["Costa Rica"],yr:2022},
  {id:"eichengreen12",short:"Eichengreen et al. 2012",full:"Eichengreen et al. (2012). When Fast-Growing Economies Slow Down.",tier:"frontier",domain:"growth",cases:["China","Malaysia","Thailand"],yr:2012},
  {id:"besleypersson11",short:"Besley & Persson 2011",full:"Besley & Persson (2011). Pillars of Prosperity. Princeton UP.",tier:"frontier",domain:"inst",cases:[],yr:2011},
  {id:"verhoogen08",short:"Verhoogen 2008",full:"Verhoogen (2008). Trade, Quality Upgrading, and Wage Inequality. QJE.",tier:"frontier",domain:"trade",cases:["Mexico"],yr:2008},
  {id:"ang20",short:"Ang 2020",full:"Ang (2020). China's Gilded Age. Cambridge UP.",tier:"frontier",domain:"inst",cases:["China"],yr:2020},
  {id:"bustos16",short:"Bustos et al. 2016",full:"Bustos et al. (2016). Agricultural Productivity and Structural Transformation. AER.",tier:"frontier",domain:"struct",cases:["Brazil"],yr:2016},
  {id:"olkenpande12",short:"Olken & Pande 2012",full:"Olken & Pande (2012). Corruption in Developing Countries. JEP.",tier:"frontier",domain:"inst",cases:[],yr:2012},
  {id:"acemoglurestrepo20",short:"Acemoglu & Restrepo 2020",full:"Acemoglu & Restrepo (2020). Robots and Jobs. JPE.",tier:"frontier",domain:"tech",cases:[],yr:2020},
  {id:"rodrik18",short:"Rodrik 2018",full:"Rodrik (2018). New Technologies, GVCs, and Developing Economies.",tier:"frontier",domain:"tech",cases:[],yr:2018},
  {id:"algan10",short:"Algan & Cahuc 2010",full:"Algan & Cahuc (2010). Inherited Trust and Growth. AER.",tier:"frontier",domain:"social",cases:[],yr:2010},
  {id:"park17",short:"Park et al. 2017",full:"Park et al. (2017). Reforestation Policy: Korea. Land Use Policy.",tier:"frontier",domain:"env",cases:["Korea"],yr:2017},
  {id:"adh13",short:"Autor, Dorn & Hanson 2013",full:"Autor et al. (2013). The China Syndrome. AER.",tier:"frontier",domain:"trade",cases:["China"],yr:2013},
  {id:"glaeser04",short:"Glaeser et al. 2004",full:"Glaeser et al. (2004). Do Institutions Cause Growth? J Econ Growth.",tier:"frontier",domain:"inst",cases:[],yr:2004},
  {id:"kinglevine93",short:"King & Levine 1993",full:"King & Levine (1993). Finance and Growth. QJE.",tier:"frontier",domain:"finance",cases:[],yr:1993},
  {id:"laportaetal98",short:"La Porta et al. 1998",full:"La Porta et al. (1998). Law and Finance. JPE.",tier:"frontier",domain:"finance",cases:[],yr:1998},
  {id:"banerjee05india",short:"Banerjee & Iyer 2005",full:"Banerjee & Iyer (2005). History, Institutions, and Economic Performance: India. AER.",tier:"frontier",domain:"inst",cases:["India"],yr:2005},
  {id:"duflo01",short:"Duflo 2001",full:"Duflo (2001). Schooling and Labor Market Consequences in Indonesia. AER.",tier:"frontier",domain:"human",cases:["Indonesia"],yr:2001},
  {id:"sachs95",short:"Sachs & Warner 1995",full:"Sachs & Warner (1995). Economic Reform and Global Integration. BPEA.",tier:"frontier",domain:"trade",cases:[],yr:1995},
  // New frontier
  {id:"yang15",short:"Yang 2015",full:"Yang (2015). Saemaul Undong Revisited: State-Society Dynamics. J Int Dev.",tier:"frontier",domain:"social",cases:["Korea"],yr:2015},
  {id:"donaldson18",short:"Donaldson 2018",full:"Donaldson (2018). Railroads of the Raj. AER.",tier:"frontier",domain:"struct",cases:["India"],yr:2018},
  {id:"asher20",short:"Asher & Novosad 2020",full:"Asher & Novosad (2020). Rural Roads and Local Economic Development. AER.",tier:"frontier",domain:"struct",cases:["India"],yr:2020},
  {id:"burgess15",short:"Burgess et al. 2015",full:"Burgess et al. (2015). The Value of Democracy: Road Building in Kenya. AER.",tier:"frontier",domain:"inst",cases:["Kenya"],yr:2015},
  {id:"juhasz18",short:"Juhasz 2018",full:"Juhasz (2018). Temporary Protection and Technology Adoption. AER.",tier:"frontier",domain:"state",cases:["France"],yr:2018},
  {id:"aghion15",short:"Aghion et al. 2015",full:"Aghion et al. (2015). Industrial Policy and Competition. AEJ: Macro.",tier:"frontier",domain:"state",cases:["China"],yr:2015},
  {id:"liu19",short:"Liu 2019",full:"Liu (2019). Industrial Policies in Production Networks. QJE.",tier:"frontier",domain:"state",cases:["China","Korea"],yr:2019},
  {id:"lagakos13",short:"Lagakos & Waugh 2013",full:"Lagakos & Waugh (2013). Selection, Agriculture, and Productivity Differences. AER.",tier:"frontier",domain:"struct",cases:[],yr:2013},
  {id:"bryan14",short:"Bryan et al. 2014",full:"Bryan et al. (2014). Underinvestment in Seasonal Migration. Econometrica.",tier:"frontier",domain:"struct",cases:["Bangladesh"],yr:2014},
  {id:"bazzi20",short:"Bazzi et al. 2020",full:"Bazzi et al. (2020). Frontier Culture: Roots of Rugged Individualism. Econometrica.",tier:"frontier",domain:"social",cases:["US"],yr:2020},
  {id:"nunn11",short:"Nunn & Wantchekon 2011",full:"Nunn & Wantchekon (2011). Slave Trade and Origins of Mistrust in Africa. AER.",tier:"frontier",domain:"social",cases:[],yr:2011},
  {id:"autor14",short:"Autor et al. 2014",full:"Autor et al. (2014). Trade Adjustment: Worker-Level Evidence. QJE.",tier:"frontier",domain:"trade",cases:["US"],yr:2014},
  {id:"amiti07",short:"Amiti & Konings 2007",full:"Amiti & Konings (2007). Trade Liberalization, Intermediate Inputs, and Productivity. AER.",tier:"frontier",domain:"trade",cases:["Indonesia"],yr:2007},
  {id:"dinkelman11",short:"Dinkelman 2011",full:"Dinkelman (2011). Effects of Rural Electrification on Employment. AER.",tier:"frontier",domain:"struct",cases:["South Africa"],yr:2011},
  {id:"lipscomb13",short:"Lipscomb et al. 2013",full:"Lipscomb et al. (2013). Development Effects of Electrification. AEJ: Applied.",tier:"frontier",domain:"struct",cases:["Brazil"],yr:2013},

  // ═══ SUPPORTING ═══
  {id:"young95",short:"Young 1995",full:"Young (1995). The Tyranny of Numbers. QJE.",tier:"supporting",domain:"growth",cases:["Korea","Singapore","Taiwan"],yr:1995},
  {id:"krugman94",short:"Krugman 1994",full:"Krugman (1994). The Myth of Asia's Miracle. Foreign Affairs.",tier:"supporting",domain:"growth",cases:["Korea","Singapore"],yr:1994},
  {id:"lucas93",short:"Lucas 1993",full:"Lucas (1993). Making a Miracle. Econometrica.",tier:"supporting",domain:"growth",cases:["Korea"],yr:1993},
  {id:"caselli05",short:"Caselli 2005",full:"Caselli (2005). Accounting for Cross-Country Income Differences. Handbook.",tier:"supporting",domain:"growth",cases:[],yr:2005},
  {id:"gollin02",short:"Gollin et al. 2002",full:"Gollin et al. (2002). The Role of Agriculture. AER.",tier:"supporting",domain:"struct",cases:[],yr:2002},
  {id:"rodrik07",short:"Rodrik 2007",full:"Rodrik (2007). One Economics, Many Recipes. Princeton UP.",tier:"supporting",domain:"growth",cases:[],yr:2007},
  {id:"hausmann07",short:"Hausmann et al. 2007",full:"Hausmann et al. (2007). What You Export Matters. J Econ Growth.",tier:"supporting",domain:"trade",cases:[],yr:2007},
  {id:"wade90",short:"Wade 1990",full:"Wade (1990). Governing the Market. Princeton UP.",tier:"supporting",domain:"state",cases:["Taiwan"],yr:1990},
  {id:"wb93",short:"World Bank 1993",full:"World Bank (1993). The East Asian Miracle. Oxford UP.",tier:"supporting",domain:"state",cases:["Korea","Taiwan","Singapore","Malaysia","Thailand","Indonesia"],yr:1993},
  {id:"arrow62",short:"Arrow 1962",full:"Arrow (1962). Learning by Doing. Rev Econ Stud.",tier:"supporting",domain:"trade",cases:[],yr:1962},
  {id:"baldwin16",short:"Baldwin 2016",full:"Baldwin (2016). The Great Convergence. Harvard UP.",tier:"supporting",domain:"trade",cases:[],yr:2016},
  {id:"putnam93",short:"Putnam 1993",full:"Putnam (1993). Making Democracy Work. Princeton UP.",tier:"supporting",domain:"social",cases:["Italy"],yr:1993},
  {id:"miguel05",short:"Miguel & Gugerty 2005",full:"Miguel & Gugerty (2005). Ethnic Diversity and Public Goods. J Pub Econ.",tier:"supporting",domain:"social",cases:["Kenya"],yr:2005},
  {id:"saemaul12",short:"ADB 2012 Saemaul",full:"ADB (2012). The Saemaul Undong Movement in Korea.",tier:"supporting",domain:"social",cases:["Korea"],yr:2012},
  {id:"studwell13",short:"Studwell 2013",full:"Studwell (2013). How Asia Works. Grove Press.",tier:"supporting",domain:"state",cases:["Korea","Taiwan","Indonesia"],yr:2013},
  {id:"booth12",short:"Booth & Golooba-M. 2012",full:"Booth & Golooba-Mutebi (2012). Developmental Patrimonialism? Rwanda.",tier:"supporting",domain:"inst",cases:["Rwanda"],yr:2012},
  {id:"diao19",short:"Diao et al. 2019",full:"Diao et al. (2019). Recent Growth Boom. Palgrave.",tier:"supporting",domain:"struct",cases:["Ethiopia","Nigeria","Kenya"],yr:2019},
  {id:"rodriguezclare01",short:"Rodriguez-Clare 2001",full:"Rodriguez-Clare (2001). Costa Rica's Development Strategy. J Human Dev.",tier:"supporting",domain:"trade",cases:["Costa Rica"],yr:2001},
  {id:"growthreport08",short:"Growth Report 2008",full:"Commission on Growth and Development (2008). The Growth Report.",tier:"supporting",domain:"growth",cases:[],yr:2008},
  {id:"frankelromer99",short:"Frankel & Romer 1999",full:"Frankel & Romer (1999). Does Trade Cause Growth? AER.",tier:"supporting",domain:"trade",cases:[],yr:1999},
  {id:"galiani14",short:"Galiani & Torrens 2014",full:"Galiani & Torrens (2014). Political Economy of Trade in Argentina.",tier:"supporting",domain:"inst",cases:["Argentina"],yr:2014},
  {id:"diazalejandro85",short:"Diaz Alejandro 1985",full:"Diaz Alejandro (1985). Good-bye Financial Repression. J Dev Econ.",tier:"supporting",domain:"finance",cases:["Argentina","Chile"],yr:1985},
  {id:"cherif19",short:"Cherif & Hasanov 2019",full:"Cherif & Hasanov (2019). The Return of the Policy That Shall Not Be Named. IMF WP.",tier:"supporting",domain:"state",cases:["Korea","Taiwan"],yr:2019},
  // Finance additions
  {id:"rajanzingales98",short:"Rajan & Zingales 1998",full:"Rajan & Zingales (1998). Financial Dependence and Growth. AER.",tier:"frontier",domain:"finance",cases:[],yr:1998},
  {id:"kaminsky99",short:"Kaminsky & Reinhart 1999",full:"Kaminsky & Reinhart (1999). The Twin Crises. AER.",tier:"frontier",domain:"finance",cases:["Argentina","Indonesia","Korea","Thailand"],yr:1999},
  {id:"radeletsachs98",short:"Radelet & Sachs 1998",full:"Radelet & Sachs (1998). The East Asian Financial Crisis. Brookings.",tier:"supporting",domain:"finance",cases:["Korea","Indonesia","Thailand"],yr:1998},
  // Demographics additions
  {id:"galorweil00",short:"Galor & Weil 2000",full:"Galor & Weil (2000). Population, Technology, and Growth. AER.",tier:"spine",domain:"human",cases:[],yr:2000},
  {id:"bloomcanning03",short:"Bloom, Canning & Sevilla 2003",full:"Bloom, Canning & Sevilla (2003). The Demographic Dividend. Pop & Dev Review.",tier:"frontier",domain:"human",cases:["Korea","Singapore","Thailand"],yr:2003},
  {id:"young05",short:"Young 2005",full:"Young (2005). The Gift of the Dying. QJE.",tier:"frontier",domain:"human",cases:["South Africa"],yr:2005},
];

const edges=[
  // Concept-Concept
  {s:"c_struct",t:"c_growth",type:"causes",note:"Reallocation drives aggregate productivity"},
  {s:"c_inst",t:"c_growth",type:"causes",note:"Institutions shape incentives for investment"},
  {s:"c_trade",t:"c_struct",type:"causes",note:"Export competition forces sectoral upgrading"},
  {s:"c_indpol",t:"c_struct",type:"causes",note:"Policy directs resources to high-productivity sectors"},
  {s:"c_devstate",t:"c_indpol",type:"enables",note:"State capacity precondition for IP"},
  {s:"c_tech",t:"c_struct",type:"causes",note:"Tech adoption raises within-sector productivity"},
  {s:"c_trade",t:"c_tech",type:"enables",note:"MNCs transfer technology through supply chains"},
  {s:"c_human",t:"c_tech",type:"enables",note:"Education enables technology absorption"},
  {s:"c_human",t:"c_growth",type:"causes",note:"Skills drive labor productivity"},
  {s:"c_demog",t:"c_growth",type:"causes",note:"Working-age bulge boosts saving and output"},
  {s:"c_inst",t:"c_indpol",type:"enables",note:"Coalitions determine policy feasibility"},
  {s:"c_social",t:"c_infra",type:"enables",note:"Social capital enables collective provision"},
  {s:"c_infra",t:"c_struct",type:"enables",note:"Infrastructure reduces transaction costs"},
  {s:"c_finance",t:"c_growth",type:"causes",note:"Financial systems mobilize savings"},
  {s:"c_env",t:"c_growth",type:"challenges",note:"Environmental costs constrain growth"},
  {s:"c_tech",t:"c_trade",type:"challenges",note:"Automation may close manufacturing pathway"},
  {s:"c_inst",t:"c_growth",type:"challenges",note:"Geography constrains via disease, transport"},
  {s:"c_trade",t:"c_tech",type:"enables",note:"Exporting exposes firms to frontier tech"},
  {s:"c_finance",t:"c_indpol",type:"enables",note:"Directed credit as IP tool"},
  // Paper → Concept foundational
  {s:"solow57",t:"c_growth",type:"foundational",note:"Created growth accounting framework"},
  {s:"halljones99",t:"c_growth",type:"foundational",note:"Institutions explain TFP differences"},
  {s:"romer90",t:"c_growth",type:"foundational",note:"Ideas as nonrival goods"},
  {s:"mankiw92",t:"c_growth",type:"extends",note:"Augmented Solow with human capital"},
  {s:"barro91",t:"c_growth",type:"foundational",note:"Launched cross-country growth regressions"},
  {s:"gerschenkron62",t:"c_growth",type:"foundational",note:"Advantages of backwardness"},
  {s:"gerschenkron62",t:"c_devstate",type:"foundational",note:"State substitutes for missing prerequisites"},
  {s:"ajr01",t:"c_inst",type:"foundational",note:"Settler mortality launched institutional economics"},
  {s:"north91",t:"c_inst",type:"foundational",note:"Defined institutions as rules of the game"},
  {s:"lewis54",t:"c_struct",type:"foundational",note:"Dual economy: surplus labor transfer"},
  {s:"mcmrodrik11",t:"c_struct",type:"foundational",note:"Within vs. between sector decomposition"},
  {s:"hrv05",t:"c_growth",type:"foundational",note:"Decision tree for binding constraints"},
  {s:"amsden89",t:"c_devstate",type:"foundational",note:"Korea disciplined subsidized firms"},
  {s:"amsden89",t:"c_indpol",type:"foundational",note:"Reciprocal discipline in IP"},
  {s:"johnson82",t:"c_devstate",type:"foundational",note:"Defined developmental state with MITI"},
  {s:"evans95",t:"c_devstate",type:"foundational",note:"Embedded autonomy concept"},
  {s:"melitz03",t:"c_trade",type:"foundational",note:"Trade selects productive firms"},
  {s:"javorcik04",t:"c_trade",type:"foundational",note:"FDI spillovers via backward linkages"},
  {s:"moscona23",t:"c_tech",type:"foundational",note:"Technology fails in wrong conditions"},
  {s:"reinhart09",t:"c_finance",type:"foundational",note:"Recurring financial crisis patterns"},
  {s:"rodrik16",t:"c_growth",type:"foundational",note:"Deindustrializing before getting rich"},
  {s:"gk95",t:"c_env",type:"foundational",note:"Environmental Kuznets Curve"},
  {s:"hirschman58",t:"c_infra",type:"foundational",note:"Unbalanced growth and linkages"},
  {s:"bloomwilliamson98",t:"c_demog",type:"foundational",note:"Demographic dividend in East Asia"},
  {s:"hanushek12",t:"c_human",type:"foundational",note:"Cognitive skills drive growth"},
  {s:"nunn08",t:"c_inst",type:"foundational",note:"Slave trade destroyed trust and institutions"},
  {s:"dell10",t:"c_inst",type:"applies",note:"Colonial mita persists via institutions"},
  {s:"sachs03",t:"c_inst",type:"foundational",note:"Geography directly affects income"},
  {s:"easterly97",t:"c_social",type:"foundational",note:"Ethnic divisions destroy growth"},
  {s:"alesina03",t:"c_social",type:"foundational",note:"Defined fractionalization"},
  {s:"banerjeeduflo05",t:"c_growth",type:"challenges",note:"Macro theory misses heterogeneity"},
  {s:"banerjeeduflo05",t:"c_struct",type:"extends",note:"Micro evidence on structural change"},
  {s:"algan10",t:"c_social",type:"foundational",note:"Inherited trust explains growth gaps"},
  {s:"acemoglurestrepo20",t:"c_tech",type:"foundational",note:"Automation displaces routine labor"},
  {s:"song11",t:"c_struct",type:"applies",note:"Modeled China SOE-to-private reallocation"},
  {s:"kinglevine93",t:"c_finance",type:"foundational",note:"Financial depth predicts growth"},
  {s:"laportaetal98",t:"c_finance",type:"foundational",note:"Legal origins shape finance"},
  {s:"pritchett00",t:"c_growth",type:"foundational",note:"Growth episodes taxonomy"},
  {s:"duflo01",t:"c_human",type:"applies",note:"School construction raises wages"},
  {s:"ostrom90",t:"c_social",type:"foundational",note:"Formalized collective action for shared resources"},
  {s:"herrendorf14",t:"c_struct",type:"foundational",note:"Definitive modern synthesis of structural transformation"},
  {s:"guiso06",t:"c_social",type:"foundational",note:"Incorporated cultural priors into economic outcomes"},
  {s:"harrison10",t:"c_trade",type:"foundational",note:"Synthesis of trade, FDI, and IP synergies"},
  {s:"lagakos13",t:"c_struct",type:"foundational",note:"Talent sorting explains ag productivity gaps"},
  {s:"donaldson18",t:"c_infra",type:"foundational",note:"Transport infrastructure massively reduces trade costs"},
  // Paper → Concept extends/applies/challenges
  {s:"ar12",t:"c_inst",type:"extends",note:"Inclusive vs. extractive institutions"},
  {s:"lane22",t:"c_indpol",type:"applies",note:"Causal evidence on Korea HCI via RDD"},
  {s:"atkin17exp",t:"c_trade",type:"applies",note:"RCT: exporting raises quality"},
  {s:"hsiehklenow09",t:"c_struct",type:"applies",note:"Misallocation costs in China and India"},
  {s:"besleypersson11",t:"c_inst",type:"extends",note:"State capacity endogenous to politics"},
  {s:"besleypersson11",t:"c_devstate",type:"extends",note:"Fiscal/legal capacity clusters"},
  {s:"rodrik18",t:"c_tech",type:"extends",note:"GVCs may close manufacturing pathway"},
  {s:"park17",t:"c_env",type:"case_of",note:"Korea reforestation as state capacity"},
  {s:"adh13",t:"c_trade",type:"challenges",note:"Trade destroyed US manufacturing jobs"},
  {s:"glaeser04",t:"c_inst",type:"challenges",note:"Human capital causes growth, not institutions"},
  {s:"rodrik04",t:"c_inst",type:"extends",note:"Institutions rule over geography and trade"},
  {s:"sachs95",t:"c_trade",type:"foundational",note:"Openness predicts growth acceleration"},
  {s:"banerjee05india",t:"c_inst",type:"applies",note:"Colonial land tenure persists in India"},
  // New paper → concept edges
  {s:"yang15",t:"c_infra",type:"applies",note:"Infrastructure diverges based on social mobilization (Saemaul)"},
  {s:"yang15",t:"c_social",type:"applies",note:"Effective infrastructure endogenous to social capital"},
  {s:"asher20",t:"c_infra",type:"applies",note:"Rural roads reallocate labor but don't always create wealth alone"},
  {s:"asher20",t:"c_struct",type:"enables",note:"Roads enable shift from agriculture to wage labor"},
  {s:"burgess15",t:"c_infra",type:"challenges",note:"Road building driven by ethnic fractionalization, not efficiency"},
  {s:"juhasz18",t:"c_indpol",type:"applies",note:"Natural experiment: infant industry protection works temporarily"},
  {s:"aghion15",t:"c_indpol",type:"extends",note:"IP works best when preserving competition"},
  {s:"liu19",t:"c_indpol",type:"extends",note:"Subsidize upstream sectors for max spillover"},
  {s:"cherif19",t:"c_devstate",type:"extends",note:"IMF's modern case for 'True Industrial Policy'"},
  {s:"bryan14",t:"c_struct",type:"applies",note:"Risk prevents seasonal labor mobility"},
  {s:"bazzi20",t:"c_social",type:"applies",note:"Historical frontiers breed persistent individualism"},
  {s:"amiti07",t:"c_trade",type:"applies",note:"Cheaper imported inputs boost productivity"},
  {s:"dinkelman11",t:"c_infra",type:"applies",note:"Electrification increases female labor participation"},
  {s:"lipscomb13",t:"c_infra",type:"applies",note:"Electricity grids stimulate structural shifts"},
  // Paper → Paper
  {s:"halljones99",t:"solow57",type:"extends",note:"Extended Solow for cross-country TFP"},
  {s:"ajr01",t:"halljones99",type:"extends",note:"Institutions as deep TFP determinant"},
  {s:"ajr01",t:"north91",type:"extends",note:"Empirical test of North's framework"},
  {s:"ar12",t:"ajr01",type:"extends",note:"Expanded the AJR thesis"},
  {s:"hsiehklenow09",t:"solow57",type:"extends",note:"Decomposed TFP into misallocation"},
  {s:"mcmrodrik11",t:"lewis54",type:"extends",note:"Modern Lewis-type decomposition"},
  {s:"lane22",t:"amsden89",type:"applies",note:"Causal test of Amsden on Korean HCI"},
  {s:"lane22",t:"rodrik95",type:"applies",note:"Tests IP interventions"},
  {s:"atkin17exp",t:"melitz03",type:"applies",note:"Experimental Melitz-type selection"},
  {s:"atkin17exp",t:"arrow62",type:"applies",note:"Direct test of learning by exporting"},
  {s:"heath15",t:"melitz03",type:"case_of",note:"Bangladesh garments as trade-driven change"},
  {s:"moscona23",t:"atkin17soccer",type:"extends",note:"Both: adoption fails structurally"},
  {s:"atkin17soccer",t:"bloom13",type:"extends",note:"Management as organizational barrier"},
  {s:"alfaro22",t:"javorcik04",type:"extends",note:"Firm data confirms FDI spillovers"},
  {s:"verhoogen08",t:"melitz03",type:"extends",note:"Trade induces quality upgrading"},
  {s:"rodrik16",t:"eichengreen12",type:"extends",note:"Premature deindustrialization builds on slowdown evidence"},
  {s:"acemoglurestrepo20",t:"rodrik16",type:"extends",note:"Automation accelerates premature deindustrialization"},
  {s:"ang20",t:"olkenpande12",type:"challenges",note:"Some corruption lubricates growth"},
  {s:"rodrik07",t:"hrv05",type:"extends",note:"Book-length diagnostics"},
  {s:"bustos16",t:"lewis54",type:"applies",note:"Brazil: ag productivity releases labor"},
  {s:"besleypersson11",t:"evans95",type:"extends",note:"Formalized state capacity"},
  {s:"booth12",t:"evans95",type:"challenges",note:"Rwanda: patrimonialism not autonomy"},
  {s:"saemaul12",t:"hirschman58",type:"case_of",note:"Saemaul as community linkage"},
  {s:"putnam93",t:"algan10",type:"foundational",note:"Civic traditions theory"},
  {s:"miguel05",t:"putnam93",type:"applies",note:"Tests social capital in Kenya"},
  {s:"young95",t:"solow57",type:"applies",note:"Debunked Asian TFP miracle"},
  {s:"krugman94",t:"young95",type:"extends",note:"Popularized input-driven growth"},
  {s:"young95",t:"lane22",type:"challenges",note:"Lane shows Young underestimated IP"},
  {s:"studwell13",t:"amsden89",type:"extends",note:"Compared IP success vs. failure"},
  {s:"mankiw92",t:"solow57",type:"extends",note:"Added human capital to Solow"},
  {s:"barro91",t:"solow57",type:"applies",note:"Cross-country convergence test"},
  {s:"romer90",t:"solow57",type:"challenges",note:"Endogenized the Solow residual"},
  {s:"johnson82",t:"evans95",type:"foundational",note:"Evans built on Johnson"},
  {s:"johnson82",t:"amsden89",type:"foundational",note:"Amsden extended MITI to Korea"},
  {s:"nunn08",t:"ajr01",type:"extends",note:"Slave trade as alternative colonial channel"},
  {s:"dell10",t:"ajr01",type:"extends",note:"Mita as within-country institutions test"},
  {s:"sachs03",t:"ajr01",type:"challenges",note:"Geography has direct effects"},
  {s:"rodrik04",t:"ajr01",type:"extends",note:"Institutions win the horse race"},
  {s:"rodrik04",t:"sachs03",type:"challenges",note:"Institutions beat geography"},
  {s:"glaeser04",t:"ajr01",type:"challenges",note:"Instrument captures human capital?"},
  {s:"easterly97",t:"alesina03",type:"foundational",note:"Alesina formalized fractionalization"},
  {s:"adh13",t:"melitz03",type:"challenges",note:"Adjustment costs larger than predicted"},
  {s:"banerjeeduflo05",t:"barro91",type:"challenges",note:"Cross-country regressions miss heterogeneity"},
  {s:"song11",t:"hsiehklenow09",type:"extends",note:"Dynamic model of China reallocation"},
  {s:"song11",t:"lewis54",type:"applies",note:"China surplus labor modeled"},
  {s:"laportaetal98",t:"kinglevine93",type:"extends",note:"Legal origins explain finance"},
  {s:"galiani14",t:"ar12",type:"case_of",note:"Argentina through institutional lens"},
  {s:"diazalejandro85",t:"reinhart09",type:"foundational",note:"Early financial liberalization analysis"},
  {s:"sachs95",t:"frankelromer99",type:"foundational",note:"Both establish trade-growth link"},
  {s:"dell10",t:"banerjee05india",type:"extends",note:"Both: colonial natural experiments"},
  {s:"hanushek12",t:"duflo01",type:"extends",note:"Cross-country evidence builds on micro school returns"},
  {s:"rodrik18",t:"rodrik16",type:"extends",note:"Technology angle on deindustrialization"},
  {s:"gerschenkron62",t:"johnson82",type:"foundational",note:"Late development inspired MITI"},
  // New paper → paper edges
  {s:"nunn11",t:"nunn08",type:"extends",note:"Proved slave trade specifically destroyed interpersonal trust"},
  {s:"autor14",t:"adh13",type:"extends",note:"Worker-level panel data on the China Shock"},
  {s:"lane22",t:"liu19",type:"applies",note:"Causal evidence for the network theory Liu proposed"},
  {s:"juhasz18",t:"amsden89",type:"applies",note:"Historical natural experiment validating infant industry logic"},
  {s:"liu19",t:"aghion15",type:"extends",note:"Network targeting extends competition-preserving IP"},
  {s:"bryan14",t:"lagakos13",type:"extends",note:"Spatial frictions explain sorting failures Lagakos identified"},
  {s:"asher20",t:"donaldson18",type:"extends",note:"Modern rural roads test extending Donaldson's railroad findings"},
  {s:"burgess15",t:"miguel05",type:"extends",note:"Ethnic politics distort infrastructure provision"},
  {s:"yang15",t:"saemaul12",type:"extends",note:"State-society dynamics behind Saemaul's success"},
  {s:"bazzi20",t:"guiso06",type:"extends",note:"Culture as persistent frontier-era inheritance"},
  {s:"herrendorf14",t:"mcmrodrik11",type:"extends",note:"Comprehensive handbook treatment of structural change"},
  {s:"lipscomb13",t:"dinkelman11",type:"extends",note:"Both: electrification as structural transformation catalyst"},
  {s:"amiti07",t:"melitz03",type:"extends",note:"Input tariff reductions boost firm productivity"},
  {s:"lane22",t:"cherif19",type:"extends",note:"Causal evidence aligns with IMF reappraisal of IP"},
  // Edges for previously orphan papers
  {s:"lucas93",t:"c_growth",type:"applies",note:"Modeled Korea's miracle via human capital externalities"},
  {s:"lucas93",t:"romer90",type:"applies",note:"Applied endogenous growth to East Asia"},
  {s:"caselli05",t:"solow57",type:"extends",note:"Modern decomposition of cross-country income"},
  {s:"caselli05",t:"halljones99",type:"extends",note:"Updated development accounting"},
  {s:"gollin02",t:"c_struct",type:"applies",note:"Quantified agriculture's role in income gaps"},
  {s:"gollin02",t:"lewis54",type:"extends",note:"Formalized dual economy reallocation gains"},
  {s:"hausmann07",t:"c_trade",type:"extends",note:"Export composition predicts growth"},
  {s:"hausmann07",t:"hrv05",type:"extends",note:"Product space as diagnostics tool"},
  {s:"wade90",t:"c_devstate",type:"applies",note:"Taiwan's governed market as developmental state"},
  {s:"wade90",t:"johnson82",type:"extends",note:"Extended developmental state to Taiwan"},
  {s:"wb93",t:"c_indpol",type:"applies",note:"East Asian miracle through selective intervention"},
  {s:"wb93",t:"amsden89",type:"challenges",note:"Market-friendly framing vs. Amsden's dirigisme"},
  {s:"baldwin16",t:"c_trade",type:"extends",note:"GVCs transformed trade-development nexus"},
  {s:"baldwin16",t:"melitz03",type:"extends",note:"Second unbundling changes trade dynamics"},
  {s:"diao19",t:"c_struct",type:"applies",note:"Africa's structural transformation without manufacturing"},
  {s:"diao19",t:"mcmrodrik11",type:"extends",note:"Updated decomposition for recent African growth"},
  {s:"rodriguezclare01",t:"c_trade",type:"case_of",note:"Costa Rica's FDI-led development strategy"},
  {s:"rodriguezclare01",t:"javorcik04",type:"foundational",note:"Early Costa Rica FDI case study"},
  {s:"growthreport08",t:"c_growth",type:"extends",note:"Policy synthesis of growth diagnostics"},
  {s:"growthreport08",t:"hrv05",type:"extends",note:"Applied diagnostics to growth commission"},
  // New finance paper edges
  {s:"rajanzingales98",t:"c_finance",type:"foundational",note:"Industry-level evidence that finance causes growth"},
  {s:"rajanzingales98",t:"kinglevine93",type:"extends",note:"Causal identification of finance-growth link"},
  {s:"kaminsky99",t:"c_finance",type:"foundational",note:"Banking crises trigger currency crises and vice versa"},
  {s:"kaminsky99",t:"reinhart09",type:"foundational",note:"Twin crises framework preceding This Time Is Different"},
  {s:"radeletsachs98",t:"c_finance",type:"case_of",note:"East Asian crisis as capital account reversal"},
  {s:"radeletsachs98",t:"kaminsky99",type:"foundational",note:"Crisis case study contemporaneous with twin crises theory"},
  // New demographics paper edges
  {s:"galorweil00",t:"c_demog",type:"foundational",note:"Unified growth theory: population-technology interaction"},
  {s:"galorweil00",t:"c_growth",type:"foundational",note:"Endogenized demographic transition within growth"},
  {s:"galorweil00",t:"solow57",type:"extends",note:"Population endogenous unlike Solow exogenous assumption"},
  {s:"bloomcanning03",t:"c_demog",type:"foundational",note:"Working-age share drives miracle-era saving and growth"},
  {s:"bloomcanning03",t:"bloomwilliamson98",type:"extends",note:"Extended demographic dividend to health and policy channels"},
  {s:"young05",t:"c_demog",type:"applies",note:"HIV epidemic perversely raises per-capita income via labor scarcity"},
  {s:"young05",t:"c_human",type:"applies",note:"Mortality shock increases human capital investment in survivors"},
];

const tours=[
  {id:"t_export",title:"The Export Discipline Story",sub:"How trade drives firm capability and structural change",color:"#5BA3D4",
   stops:[
    {nid:"arrow62",narr:"Arrow (1962) proposed that productivity improves through experience. But where does the pressure to learn come from?"},
    {nid:"melitz03",narr:"Melitz (2003): trade forces Darwinian selection. Only productive firms export, raising industry TFP."},
    {nid:"atkin17exp",narr:"Atkin et al. (2017): first RCT of learning by exporting. Egyptian rug makers given export orders improve quality directly."},
    {nid:"verhoogen08",narr:"Verhoogen (2008): peso devaluation pushes Mexican firms into exports, triggering quality upgrading and wage gains."},
    {nid:"amiti07",narr:"Amiti & Konings (2007): cheaper imported inputs matter as much as export access\u2014trade works through the supply side too."},
    {nid:"heath15",narr:"Heath & Mobarak (2015): Bangladesh garment exports transformed women's lives\u2014later marriage, more schooling, higher participation."},
    {nid:"c_struct",narr:"The endpoint: trade-driven firm upgrading is one of the most powerful engines of structural transformation."},
  ]},
  {id:"t_inst",title:"Institutions All the Way Down?",sub:"The great debate over deep determinants",color:"#D45B5B",
   stops:[
    {nid:"north91",narr:"North (1991): institutions are the humanly devised constraints that structure interaction\u2014the rules of the game."},
    {nid:"ajr01",narr:"AJR (2001): settler mortality determined colonial institutions, which persist and explain today's income gaps. A paradigm launched."},
    {nid:"sachs03",narr:"Sachs (2003) pushed back: geography directly affects income through disease and transport, not just institutions."},
    {nid:"rodrik04",narr:"Rodrik et al. (2004) ran the horse race. Institutions won\u2014but what does 'institutions' mean?"},
    {nid:"glaeser04",narr:"Glaeser et al. (2004): maybe AJR's instrument captures human capital, not institutions. Settlers brought knowledge."},
    {nid:"nunn08",narr:"Nunn (2008): the slave trade destroyed trust through a completely different mechanism than settler colonialism."},
    {nid:"dell10",narr:"Dell (2010): Peru's colonial mita shows institutional persistence within a single country\u2014clean causal design."},
    {nid:"ar12",narr:"Acemoglu & Robinson (2012) synthesized it: inclusive vs. extractive. Powerful\u2014but perhaps too neat."},
  ]},
  {id:"t_korea",title:"Decoding the Korean Miracle",sub:"From backwardness to disciplined industrial policy",color:"#D45B99",
   stops:[
    {nid:"gerschenkron62",narr:"Gerschenkron (1962): late developers can borrow technology; the state can substitute for missing markets."},
    {nid:"johnson82",narr:"Johnson (1982) defined the developmental state with MITI. Korea would follow with a distinctive twist."},
    {nid:"amsden89",narr:"Amsden (1989): Korea subsidized firms but demanded performance. Export targets, productivity benchmarks. Reciprocal discipline."},
    {nid:"evans95",narr:"Evans (1995): embedded autonomy. Bureaucrats were competent yet connected to industry."},
    {nid:"rodrik95",narr:"Rodrik (1995): Korea and Taiwan both succeeded through different mechanisms. No single model."},
    {nid:"lane22",narr:"Lane (2022): causal evidence via RDD. Korea's HCI drive created persistent manufacturing capacity."},
    {nid:"liu19",narr:"Liu (2019): production network theory\u2014subsidize upstream sectors for maximum downstream spillover. The theory behind Lane's evidence."},
    {nid:"young95",narr:"Young (1995) warned: much was input accumulation, not TFP. Lane shows he underestimated IP\u2014but the tension remains."},
  ]},
  {id:"t_tech",title:"The Technology Puzzle",sub:"Why productive knowledge doesn't travel",color:"#D4A85B",
   stops:[
    {nid:"solow57",narr:"Solow (1957): most growth is the 'residual'\u2014technology. If it's a public good, why don't poor countries adopt it?"},
    {nid:"romer90",narr:"Romer (1990): ideas are nonrival but excludable. Innovation requires investment. The gap isn't automatic to close."},
    {nid:"moscona23",narr:"Moscona & Sastry (2023): technology is location-specific. Temperate agricultural innovations fail in tropical conditions."},
    {nid:"atkin17soccer",narr:"Atkin et al. (2017): organizational barriers. Pakistani firms rejected better tech because it disrupted production hierarchies."},
    {nid:"bloom13",narr:"Bloom et al. (2013): even basic management\u2014inventory, quality control\u2014fails to diffuse. RCT proves it works but isn't adopted."},
    {nid:"c_tech",narr:"Technology diffusion fails from misfit\u2014between tech and conditions, organizations, or incentives. Policy must address the binding barrier."},
  ]},
  {id:"t_trap",title:"Why Miracles End",sub:"Middle-income traps, reversals, and the closing window",color:"#FF7043",
   stops:[
    {nid:"pritchett00",narr:"Pritchett (2000): most growth episodes end. Sustained rapid growth is rare."},
    {nid:"eichengreen12",narr:"Eichengreen et al. (2012): fast growers slow around $15\u201317k GDP per capita. Near-universal."},
    {nid:"rodrik16",narr:"Rodrik (2016): premature deindustrialization. Countries run out of manufacturing at lower incomes."},
    {nid:"acemoglurestrepo20",narr:"Acemoglu & Restrepo (2020): automation accelerates this\u2014robots replace the routine tasks that powered earlier miracles."},
    {nid:"reinhart09",narr:"Reinhart & Rogoff (2009): financial crises. Liberalize, boom, bust, lost decade."},
    {nid:"ar12",narr:"Acemoglu & Robinson: extractive elites block creative destruction. Miracles end when institutions fail to evolve."},
    {nid:"c_tech",narr:"If manufacturing is closing, what replaces it? Services-led growth? Green industrialization? The next miracle may look different."},
  ]},
  {id:"t_solow",title:"The Growth Accounting Tree",sub:"From Solow's residual to the modern decomposition",color:"#E8A838",
   stops:[
    {nid:"solow57",narr:"Solow (1957): capital and labor explain a fraction. The rest is the 'residual.' But what determines it?"},
    {nid:"mankiw92",narr:"Mankiw, Romer & Weil (1992): added human capital. Fits well but can't explain the largest gaps."},
    {nid:"halljones99",narr:"Hall & Jones (1999): output differences are mostly TFP, and TFP tracks institutional quality."},
    {nid:"hsiehklenow09",narr:"Hsieh & Klenow (2009): much of TFP gap is misallocation. India and China could gain 30\u201350% by reallocating."},
    {nid:"lagakos13",narr:"Lagakos & Waugh (2013): talent sorting explains the massive agricultural productivity gaps across countries."},
    {nid:"romer90",narr:"Romer (1990) challenged it all: growth is generating ideas, not accumulating inputs. The residual is the main event."},
    {nid:"banerjeeduflo05",narr:"Banerjee & Duflo (2005): aggregate accounting misses heterogeneity. Micro evidence reveals different realities."},
  ]},
  {id:"t_infra",title:"Infrastructure & Collective Action",sub:"Roads, rails, electricity, and who builds them",color:"#5BD45B",
   stops:[
    {nid:"hirschman58",narr:"Hirschman (1958): unbalanced growth. Infrastructure creates backward and forward linkages that pull development along."},
    {nid:"ostrom90",narr:"Ostrom (1990): communities can govern shared resources without states or markets\u2014if the institutional design is right."},
    {nid:"donaldson18",narr:"Donaldson (2018): colonial Indian railroads massively reduced trade costs and raised real incomes. Infrastructure matters."},
    {nid:"asher20",narr:"Asher & Novosad (2020): but rural roads in modern India shift labor without always creating wealth. Infrastructure alone isn't enough."},
    {nid:"burgess15",narr:"Burgess et al. (2015): Kenya's roads went to co-ethnic regions, not high-return ones. Politics distorts infrastructure."},
    {nid:"dinkelman11",narr:"Dinkelman (2011): South African electrification increased female labor participation\u2014infrastructure with gendered effects."},
    {nid:"saemaul12",narr:"ADB (2012): Korea's Saemaul movement combined infrastructure with social mobilization. The complementarity is the point."},
  ]},
  {id:"t_finance",title:"From Financial Deepening to Crisis",sub:"How finance enables and then destroys growth",color:"#FF7043",
   stops:[
    {nid:"kinglevine93",narr:"King & Levine (1993): countries with deeper financial systems grow faster. Financial development predicts growth decades ahead."},
    {nid:"rajanzingales98",narr:"Rajan & Zingales (1998): industries that depend more on external finance grow faster in financially developed countries. Causal identification."},
    {nid:"laportaetal98",narr:"La Porta et al. (1998): legal origins\u2014common law vs. civil law\u2014explain why some countries develop better financial systems."},
    {nid:"diazalejandro85",narr:"D\u00EDaz-Alejandro (1985): Chile's financial liberalization led to collapse. 'Good-bye financial repression, hello financial crash.'"},
    {nid:"kaminsky99",narr:"Kaminsky & Reinhart (1999): banking crises and currency crises feed on each other. Financial liberalization without regulation is the trigger."},
    {nid:"radeletsachs98",narr:"Radelet & Sachs (1998): the 1997 Asian crisis was a capital account crisis\u2014sudden stops, not fundamentals. Korea, Indonesia, Thailand hit hardest."},
    {nid:"reinhart09",narr:"Reinhart & Rogoff (2009): eight centuries of financial folly. The pattern recurs because each generation believes 'this time is different.'"},
    {nid:"c_finance",narr:"The paradox: financial development is essential for growth, but financial liberalization without institutional guardrails creates crises that erase decades of gains."},
  ]},
  {id:"t_demog",title:"The Demographic Window",sub:"Population structure as growth engine and constraint",color:"#AB47BC",
   stops:[
    {nid:"galorweil00",narr:"Galor & Weil (2000): unified growth theory. For millennia, population growth absorbed productivity gains. The demographic transition changed everything."},
    {nid:"bloomwilliamson98",narr:"Bloom & Williamson (1998): East Asia's miracle was partly demographic. Declining fertility created a bulge of working-age adults\u2014the demographic dividend."},
    {nid:"bloomcanning03",narr:"Bloom, Canning & Sevilla (2003): the dividend isn't automatic. It requires health investment, education, and labor markets that absorb the bulge."},
    {nid:"duflo01",narr:"Duflo (2001): Indonesia's school construction program boosted earnings. Human capital investment during the demographic window amplifies the dividend."},
    {nid:"hanushek12",narr:"Hanushek & Woessmann (2012): it's not years of schooling but cognitive skills that drive growth. Quality matters more than quantity."},
    {nid:"heath15",narr:"Heath & Mobarak (2015): Bangladesh's garment exports delayed marriage and increased schooling for girls\u2014trade and demographics interacting."},
    {nid:"young05",narr:"Young (2005): the darkest test. HIV in South Africa killed working-age adults, but perversely raised per-capita income by shrinking labor supply. The demographic dividend in reverse."},
    {nid:"acemoglurestrepo20",narr:"Acemoglu & Restrepo (2020): aging societies automate. The demographic window is closing for today's developers\u2014can robots substitute for the missing workers?"},
    {nid:"c_demog",narr:"The demographic window opens once. Countries that invest in health, education, and jobs during the transition capture the dividend. Those that don't face aging before getting rich."},
  ]},
];

const CASES=[...new Set(papers.flatMap(p=>p.cases))].filter(Boolean).sort();
const MIN_YR=Math.min(...papers.map(p=>p.yr));
const MAX_YR=Math.max(...papers.map(p=>p.yr));

const ERAS=[
  {label:"Growth Accounting",start:1954,end:1979,color:"#E8A838"},
  {label:"Trade & State",start:1980,end:1995,color:"#5BA3D4"},
  {label:"Institutions",start:1996,end:2007,color:"#D45B5B"},
  {label:"Micro Revolution",start:2008,end:2018,color:"#9b7ed4"},
  {label:"Frontier Causal ID",start:2019,end:2025,color:"#5BD4A3"},
];
const baseNodeData=[...concepts,...papers,...levers,...wrConstraints];
const sprintCases=[...new Set([...Object.keys(countryLevers),...Object.keys(countryConstraints)])].sort();
const DOMAIN_ORDER=Object.keys(DOM);
const ringConcepts=[...concepts].sort((a,b)=>{const ai=DOMAIN_ORDER.indexOf(a.domain),bi=DOMAIN_ORDER.indexOf(b.domain);return ai!==bi?ai-bi:a.id.localeCompare(b.id);});

function buildGraph(fDom,fCase,fTier,fEdge,maxYr,warRoom,sprintCase,studentPapers,showStudentPapers,promotedPapers){
  const nodes=[],links=[];
  const fp=papers.filter(p=>{
    if(maxYr&&p.yr>maxYr) return false;
    if(fDom&&p.domain!==fDom) return false;
    if(fCase&&!p.cases.includes(fCase)) return false;
    if(fTier&&p.tier!==fTier) return false;
    return true;
  });
  // Promoted papers filtered same way but always included (canonical)
  const pp=(promotedPapers||[]).filter(p=>{
    if(maxYr&&p.yr>maxYr) return false;
    if(fDom&&p.domain!==fDom) return false;
    if(fCase&&!(p.cases||[]).includes(fCase)) return false;
    if(fTier&&p.tier!==fTier) return false;
    return true;
  });
  // Student papers filtered same way
  const sp=(showStudentPapers&&studentPapers)?studentPapers.filter(p=>{
    if(maxYr&&p.yr>maxYr) return false;
    if(fDom&&p.domain!==fDom) return false;
    if(fCase&&!(p.cases||[]).includes(fCase)) return false;
    if(fTier&&p.tier!==fTier) return false;
    return true;
  }):[];
  const allPapers=[...fp,...pp,...sp];
  const pids=new Set(allPapers.map(p=>p.id));
  const cids=new Set(concepts.map(c=>c.id));
  const ac=new Set();
  edges.forEach(e=>{if(fEdge&&e.type!==fEdge)return;if(pids.has(e.s)&&cids.has(e.t))ac.add(e.t);if(pids.has(e.t)&&cids.has(e.s))ac.add(e.s);});
  if(promotedPapers){promotedPapers.forEach(p=>{(p.edges||[]).forEach(e=>{if(fEdge&&e.type!==fEdge)return;if(pids.has(e.s)&&cids.has(e.t))ac.add(e.t);if(pids.has(e.t)&&cids.has(e.s))ac.add(e.s);});});}
  if(showStudentPapers&&studentPapers){studentPapers.forEach(p=>{(p.edges||[]).forEach(e=>{if(fEdge&&e.type!==fEdge)return;if(pids.has(e.s)&&cids.has(e.t))ac.add(e.t);if(pids.has(e.t)&&cids.has(e.s))ac.add(e.s);});});}
  edges.forEach(e=>{if(fEdge&&e.type!==fEdge)return;if(cids.has(e.s)&&cids.has(e.t)){if(!fDom&&!fCase&&!fTier&&!fEdge&&!maxYr){ac.add(e.s);ac.add(e.t);}else if(ac.has(e.s)||ac.has(e.t)){ac.add(e.s);ac.add(e.t);}}});
  if(!fDom&&!fCase&&!fTier&&!fEdge&&!maxYr) concepts.forEach(c=>ac.add(c.id));
  concepts.filter(c=>ac.has(c.id)).forEach(c=>nodes.push({id:c.id,type:"concept",label:c.label,desc:c.desc,r:32,color:DOM[c.domain].color,domain:c.domain,cases:[]}));
  fp.forEach(p=>{const t=TIERS[p.tier];nodes.push({id:p.id,type:"paper",label:p.short,full:p.full,r:t.r,color:DOM[p.domain].color,domain:p.domain,tier:p.tier,cases:p.cases,op:t.op,sw:t.sw,yr:p.yr});});
  pp.forEach(p=>{const t=TIERS[p.tier]||TIERS.supporting;nodes.push({id:p.id,type:"paper",label:p.short||p.title,full:p.full||p.title,r:t.r,color:DOM[p.domain]?DOM[p.domain].color:"#888",domain:p.domain,tier:p.tier,cases:p.cases||[],op:t.op,sw:t.sw,yr:p.yr,promoted:true});});
  sp.forEach(p=>{const t=TIERS[p.tier]||TIERS.supporting;nodes.push({id:p.id,type:"paper",label:p.short||p.title,full:p.full||p.title,r:t.r,color:DOM[p.domain]?DOM[p.domain].color:"#888",domain:p.domain,tier:p.tier,cases:p.cases||[],op:t.op*0.85,sw:t.sw,yr:p.yr,student:true,justification:p.justification,aiReview:p.aiReview,addedBy:p.addedBy,addedAt:p.addedAt});});
  const nids=new Set(nodes.map(n=>n.id));
  edges.forEach(e=>{if(!nids.has(e.s)||!nids.has(e.t))return;if(fEdge&&e.type!==fEdge)return;links.push({source:e.s,target:e.t,type:e.type,note:e.note});});
  // Promoted paper edges (look canonical)
  if(promotedPapers){promotedPapers.forEach(p=>{(p.edges||[]).forEach(e=>{if(!nids.has(e.s)||!nids.has(e.t))return;if(fEdge&&e.type!==fEdge)return;links.push({source:e.s,target:e.t,type:e.type,note:e.note});});});}
  // Student paper edges
  if(showStudentPapers&&studentPapers){studentPapers.forEach(p=>{(p.edges||[]).forEach(e=>{if(!nids.has(e.s)||!nids.has(e.t))return;if(fEdge&&e.type!==fEdge)return;links.push({source:e.s,target:e.t,type:e.type,note:e.note,student:true});});});}
  // War Room: add lever/constraint nodes and warEdges
  if(warRoom){
    const aL=new Set(),aC=new Set();
    if(sprintCase){(countryLevers[sprintCase]||[]).forEach(id=>aL.add(id));(countryConstraints[sprintCase]||[]).forEach(id=>aC.add(id));}
    else{levers.forEach(l=>aL.add(l.id));wrConstraints.forEach(c=>aC.add(c.id));}
    levers.filter(l=>aL.has(l.id)).forEach(l=>nodes.push({id:l.id,type:"lever",label:l.label,desc:l.desc,r:22,color:"#00E5FF",cases:[]}));
    wrConstraints.filter(c=>aC.has(c.id)).forEach(c=>nodes.push({id:c.id,type:"constraint",label:c.label,desc:c.desc,r:20,color:"#FF1744",cases:[]}));
    const nids2=new Set(nodes.map(n=>n.id));
    warEdges.forEach(e=>{if(!nids2.has(e.s)||!nids2.has(e.t))return;links.push({source:e.s,target:e.t,type:e.type,note:e.note});});
  }
  return{nodes,links};
}

function buildNeighborhoodGraph(focusId,fullGraph){
  const neighborIds=new Set([focusId]);
  fullGraph.links.forEach(l=>{
    const s=typeof l.source==="object"?l.source.id:l.source;
    const t=typeof l.target==="object"?l.target.id:l.target;
    if(s===focusId)neighborIds.add(t);
    if(t===focusId)neighborIds.add(s);
  });
  const nodes=fullGraph.nodes.filter(n=>neighborIds.has(n.id));
  if(nodes.length===0){const fn=fullGraph.nodes.find(n=>n.id===focusId);return{nodes:fn?[fn]:[],links:[]};}
  const nodeIds=new Set(nodes.map(n=>n.id));
  const links=fullGraph.links.filter(l=>{
    const s=typeof l.source==="object"?l.source.id:l.source;
    const t=typeof l.target==="object"?l.target.id:l.target;
    return nodeIds.has(s)&&nodeIds.has(t);
  });
  return{nodes,links};
}

function Btn({active,onClick,children,c}){return <button onClick={onClick} style={{display:"block",width:"100%",textAlign:"left",padding:"5px 9px",marginBottom:2,borderRadius:5,background:active?(c?c+"22":"rgba(255,255,255,0.07)"):"transparent",border:active?"1px solid "+(c||"#666")+"55":"1px solid transparent",color:active?(c||"#E0E0E8"):"#6a6a7a",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>;}
function Tag({label,active,onClick,ac}){return <button onClick={onClick} style={{padding:"2px 8px",borderRadius:10,background:active?(ac||"rgba(255,255,255,0.1)"):"rgba(255,255,255,0.03)",border:"1px solid "+(active?(ac||"#666")+"66":"rgba(255,255,255,0.06)"),color:active?"#fff":"#5a5a6a",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>;}
function Lbl({children}){return <div style={{color:"#5a5a6a",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6,marginTop:14}}>{children}</div>;}
function hexPath(r){const a=[];for(let i=0;i<6;i++){const ang=(Math.PI/3)*i-Math.PI/2;a.push((r*Math.cos(ang)).toFixed(2)+","+(r*Math.sin(ang)).toFixed(2));}return"M"+a.join("L")+"Z";}
function diamondPath(r){return"M0,"+(-r)+" L"+r+",0 L0,"+r+" L"+(-r)+",0Z";}

function ProposalModal({onClose,onAdd,existingIds}){
  const [step,setStep]=useState(0); // 0=form, 1=edges, 2=reviewing, 3=feedback
  const [title,setTitle]=useState("");
  const [authors,setAuthors]=useState("");
  const [year,setYear]=useState(2024);
  const [domain,setDomain]=useState("growth");
  const [tier,setTier]=useState("supporting");
  const [cases,setCases]=useState([]);
  const [desc,setDesc]=useState("");
  const [justification,setJustification]=useState("");
  const [propEdges,setPropEdges]=useState([]);
  const [edgeTarget,setEdgeTarget]=useState("");
  const [edgeType,setEdgeType]=useState("extends");
  const [edgeNote,setEdgeNote]=useState("");
  const [aiReview,setAiReview]=useState(null);
  const [aiError,setAiError]=useState(null);
  const [addedBy,setAddedBy]=useState("");
  const [pdfData,setPdfData]=useState(null);
  const [pdfName,setPdfName]=useState("");

  const paperId=useMemo(()=>{
    const base=(authors.split(",")[0]||"student").trim().toLowerCase().replace(/[^a-z]/g,"")+String(year).slice(2);
    let id=base,n=1;while(existingIds.has(id)){id=base+"_"+n;n++;}return id;
  },[authors,year,existingIds]);

  const targetOptions=useMemo(()=>[...concepts,...papers].map(n=>({id:n.id,label:n.short||n.label.replace("\n"," ")})).sort((a,b)=>a.label.localeCompare(b.label)),[]);

  const addEdge=()=>{
    if(!edgeTarget)return;
    if(propEdges.some(e=>(e.s===paperId&&e.t===edgeTarget)||(e.t===paperId&&e.s===edgeTarget)))return;
    setPropEdges(prev=>[...prev,{s:paperId,t:edgeTarget,type:edgeType,note:edgeNote||"Student-proposed connection"}]);
    setEdgeTarget("");setEdgeNote("");
  };

  const handlePdf=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    setPdfName(file.name);
    const reader=new FileReader();
    reader.onload=()=>setPdfData(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const runReview=async()=>{
    setStep(2);setAiError(null);
    const graphContext=`Existing concepts: ${concepts.map(c=>c.id+": "+c.label.replace("\n"," ")).join("; ")}.\nExisting papers (sample): ${papers.slice(0,40).map(p=>p.id+": "+(p.short||p.label)+" ("+p.yr+")").join("; ")}.\nEdge types: ${Object.entries(ET).filter(([,v])=>v.group==="academic").map(([k,v])=>k+": "+v.label).join(", ")}.\nDomains: ${Object.entries(DOM).map(([k,v])=>k+": "+v.label).join(", ")}.`;
    const proposalText=`STUDENT PAPER PROPOSAL:\nTitle: ${title}\nAuthors: ${authors}\nYear: ${year}\nDomain: ${domain} (${DOM[domain]?.label})\nTier: ${tier} (${TIERS[tier]?.label})\nCountry cases: ${cases.join(", ")||"None"}\nDescription: ${desc}\nStudent justification: ${justification}\nProposed edges:\n${propEdges.map(e=>"  "+e.s+" -> "+e.t+" ("+e.type+"): "+e.note).join("\n")}`;
    const msgs=[{role:"user",content:[]}];
    if(pdfData){msgs[0].content.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:pdfData}});}
    msgs[0].content.push({type:"text",text:proposalText});
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are a teaching assistant for a graduate development economics course. You're reviewing a student's proposal to add a paper to the course knowledge graph.\n\nGRAPH CONTEXT:\n${graphContext}\n\nRespond ONLY with a JSON object (no markdown fences, no preamble):\n{\n  "edgeChecks": [{"edge":"source->target","status":"green|yellow|red","comment":"brief note"}],\n  "suggestedEdges": [{"s":"nodeId","t":"nodeId","type":"edgeType","note":"why"}],\n  "tierAssessment": {"suggested":"spine|frontier|supporting","reason":"brief"},\n  "domainCheck": {"correct":true|false,"suggested":"domainKey","reason":"brief"},\n  "overallFeedback": "2-3 sentence paragraph on the quality of the student's justification and placement",\n  "justificationScore": "strong|adequate|weak"\n}`,messages:msgs})});
      const data=await resp.json();
      const text=data.content.map(i=>i.text||"").join("\n");
      const clean=text.replace(/```json|```/g,"").trim();
      setAiReview(JSON.parse(clean));setStep(3);
    }catch(err){
      setAiError("AI review failed: "+err.message+". You can still add the paper without review.");setStep(3);
    }
  };

  const handleAdd=()=>{
    const paper={id:paperId,title,short:authors.split(",")[0].trim().split(" ").pop()+" ("+year+")",full:title,authors,yr:year,domain,tier,cases,desc,justification,edges:propEdges,aiReview,addedBy:addedBy||"Anonymous",addedAt:new Date().toISOString()};
    onAdd(paper);
  };

  const CASES_LIST=[...new Set(papers.flatMap(p=>p.cases))].filter(Boolean).sort();
  const sty={overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"},
    modal:{background:"#1a1b22",border:"1px solid rgba(171,71,188,0.3)",borderRadius:12,width:560,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column"},
    header:{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"},
    body:{padding:"16px 20px",overflowY:"auto",flex:1},
    label:{fontSize:9,fontWeight:700,color:"#8a8a9a",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4,marginTop:12,display:"block"},
    input:{width:"100%",padding:"6px 10px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#d0d0da",fontSize:11,fontFamily:"inherit",outline:"none",boxSizing:"border-box"},
    textarea:{width:"100%",padding:"8px 10px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#d0d0da",fontSize:11,fontFamily:"inherit",outline:"none",resize:"vertical",minHeight:60,boxSizing:"border-box"},
    btn:{padding:"6px 16px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"none"},
    footer:{padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,justifyContent:"flex-end"}};

  return (<div style={sty.overlay} onClick={onClose}>
    <div style={sty.modal} onClick={e=>e.stopPropagation()}>
      <div style={sty.header}>
        <span style={{fontSize:15,fontWeight:700,color:"#CE93D8"}}>Propose a Paper</span>
        <div style={{display:"flex",gap:4}}>{[0,1,3].map(s=><div key={s} style={{width:s<=step?24:8,height:4,borderRadius:2,background:s<=step?"#AB47BC":"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>)}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#5a5a6a",fontSize:18,cursor:"pointer",padding:"0 4px"}}>{"\u00D7"}</button>
      </div>
      <div style={sty.body}>
        {step===0&&<div>
          <span style={sty.label}>Your Name</span>
          <input value={addedBy} onChange={e=>setAddedBy(e.target.value)} placeholder="e.g. Jane Park" style={sty.input}/>
          <span style={sty.label}>Paper Title</span>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Full title of the paper" style={sty.input}/>
          <span style={sty.label}>Authors</span>
          <input value={authors} onChange={e=>setAuthors(e.target.value)} placeholder="e.g. Rodrik, Dani" style={sty.input}/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><span style={sty.label}>Year</span><input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} style={sty.input}/></div>
            <div style={{flex:1}}><span style={sty.label}>Domain</span><select value={domain} onChange={e=>setDomain(e.target.value)} style={{...sty.input,cursor:"pointer"}}>{Object.entries(DOM).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
            <div style={{flex:1}}><span style={sty.label}>Tier</span><select value={tier} onChange={e=>setTier(e.target.value)} style={{...sty.input,cursor:"pointer"}}>{Object.entries(TIERS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
          </div>
          <span style={sty.label}>Country Cases</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{CASES_LIST.map(c=><button key={c} onClick={()=>setCases(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c])} style={{padding:"2px 8px",borderRadius:10,background:cases.includes(c)?"rgba(171,71,188,0.2)":"rgba(255,255,255,0.03)",border:"1px solid "+(cases.includes(c)?"rgba(171,71,188,0.4)":"rgba(255,255,255,0.06)"),color:cases.includes(c)?"#CE93D8":"#5a5a6a",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div>
          <span style={sty.label}>Description</span>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description of the paper's findings and methodology" style={sty.textarea}/>
          <span style={sty.label}>PDF (optional)</span>
          <input type="file" accept=".pdf" onChange={handlePdf} style={{fontSize:10,color:"#6a6a7a"}}/>
          {pdfName&&<div style={{fontSize:9,color:"#AB47BC",marginTop:4}}>{"\u2713"} {pdfName}</div>}
          <span style={sty.label}>Justification</span>
          <textarea value={justification} onChange={e=>setJustification(e.target.value)} placeholder="Why does this paper belong in the knowledge graph? How does it contribute to or challenge existing frameworks? Where should it sit in the intellectual landscape?" style={{...sty.textarea,minHeight:90}}/>
        </div>}
        {step===1&&<div>
          <div style={{fontSize:11,color:"#9a9aaa",lineHeight:1.6,marginBottom:12}}>Connect <b style={{color:"#CE93D8"}}>{title||"your paper"}</b> to existing nodes. Add 2\u20135 edges showing how it relates to the literature.</div>
          {propEdges.length>0&&<div style={{marginBottom:12}}>{propEdges.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",marginBottom:3,borderRadius:5,background:"rgba(171,71,188,0.06)",border:"1px solid rgba(171,71,188,0.15)"}}>
            <span style={{fontSize:8,color:ET[e.type]?.color||"#888",fontWeight:700,textTransform:"uppercase"}}>{ET[e.type]?.label||e.type}</span>
            <span style={{fontSize:9,color:"#d0d0da",flex:1}}>{"\u2192"} {targetOptions.find(t=>t.id===e.t)?.label||e.t}</span>
            <span style={{fontSize:8,color:"#5a5a6a",flex:1}}>{e.note}</span>
            <button onClick={()=>setPropEdges(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#FF5252",fontSize:14,cursor:"pointer",padding:"0 2px"}}>{"\u00D7"}</button>
          </div>)}</div>}
          <div style={{padding:12,borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={sty.label}>Target Node</span>
            <select value={edgeTarget} onChange={e=>setEdgeTarget(e.target.value)} style={{...sty.input,cursor:"pointer"}}>
              <option value="">Select a concept or paper...</option>
              <optgroup label="Concepts">{concepts.map(c=><option key={c.id} value={c.id}>{c.label.replace("\n"," ")}</option>)}</optgroup>
              <optgroup label="Papers">{papers.map(p=><option key={p.id} value={p.id}>{p.short||p.label} ({p.yr})</option>)}</optgroup>
            </select>
            <span style={sty.label}>Edge Type</span>
            <select value={edgeType} onChange={e=>setEdgeType(e.target.value)} style={{...sty.input,cursor:"pointer"}}>
              {Object.entries(ET).filter(([,v])=>v.group==="academic").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={sty.label}>Note</span>
            <input value={edgeNote} onChange={e=>setEdgeNote(e.target.value)} placeholder="Brief explanation of the relationship" style={sty.input}/>
            <button onClick={addEdge} disabled={!edgeTarget} style={{...sty.btn,marginTop:10,background:edgeTarget?"rgba(171,71,188,0.2)":"rgba(255,255,255,0.04)",color:edgeTarget?"#CE93D8":"#4a4a5a"}}>{"\u002B"} Add Edge</button>
          </div>
        </div>}
        {step===2&&<div style={{textAlign:"center",paddingTop:40}}>
          <div style={{fontSize:28,marginBottom:12,animation:"pulse 1.5s infinite"}}>{"\u{1F9E0}"}</div>
          <div style={{fontSize:13,color:"#CE93D8",fontWeight:600,marginBottom:6}}>AI Reviewer is reading...</div>
          <div style={{fontSize:10,color:"#5a5a6a"}}>Checking your justification, edge choices, and domain placement.</div>
        </div>}
        {step===3&&<div>
          {aiError&&<div style={{padding:10,borderRadius:6,background:"rgba(255,87,34,0.08)",border:"1px solid rgba(255,87,34,0.2)",color:"#FF7043",fontSize:10,marginBottom:12}}>{aiError}</div>}
          {aiReview&&<div>
            <div style={{fontSize:12,fontWeight:700,color:"#CE93D8",marginBottom:10}}>AI Review Complete</div>
            <div style={{padding:10,borderRadius:8,background:"rgba(171,71,188,0.06)",border:"1px solid rgba(171,71,188,0.15)",fontSize:11,color:"#c0c0ca",lineHeight:1.6,marginBottom:12}}>{aiReview.overallFeedback}</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{padding:"4px 10px",borderRadius:5,background:aiReview.justificationScore==="strong"?"rgba(76,175,80,0.15)":aiReview.justificationScore==="adequate"?"rgba(232,168,56,0.15)":"rgba(255,23,68,0.15)",color:aiReview.justificationScore==="strong"?"#66BB6A":aiReview.justificationScore==="adequate"?"#E8A838":"#FF5252",fontSize:9,fontWeight:700}}>Justification: {aiReview.justificationScore}</div>
              {aiReview.tierAssessment&&<div style={{padding:"4px 10px",borderRadius:5,background:"rgba(255,255,255,0.04)",color:"#9a9aaa",fontSize:9}}>{aiReview.tierAssessment.suggested===tier?"\u2713 Tier OK":"\u26A0 Suggests: "+TIERS[aiReview.tierAssessment.suggested]?.label}</div>}
              {aiReview.domainCheck&&!aiReview.domainCheck.correct&&<div style={{padding:"4px 10px",borderRadius:5,background:"rgba(232,168,56,0.1)",color:"#E8A838",fontSize:9}}>{"\u26A0"} Domain: {DOM[aiReview.domainCheck.suggested]?.label}</div>}
            </div>
            {aiReview.edgeChecks&&<div style={{marginBottom:12}}>
              <span style={sty.label}>Edge Review</span>
              {aiReview.edgeChecks.map((ec,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",marginBottom:2,borderRadius:4,background:"rgba(255,255,255,0.02)"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:ec.status==="green"?"#66BB6A":ec.status==="yellow"?"#E8A838":"#FF5252",flexShrink:0}}/>
                <span style={{fontSize:9,color:"#a0a0b0",flex:1}}>{ec.edge}</span>
                <span style={{fontSize:8,color:"#6a6a7a"}}>{ec.comment}</span>
              </div>)}
            </div>}
            {aiReview.suggestedEdges&&aiReview.suggestedEdges.length>0&&<div style={{marginBottom:12}}>
              <span style={sty.label}>Suggested Additional Edges</span>
              {aiReview.suggestedEdges.map((se,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",marginBottom:2,borderRadius:4,background:"rgba(76,175,80,0.04)",border:"1px solid rgba(76,175,80,0.1)"}}>
                <span style={{fontSize:8,color:"#66BB6A",fontWeight:700}}>{ET[se.type]?.label||se.type}</span>
                <span style={{fontSize:9,color:"#a0a0b0"}}>{"\u2192"} {se.t}</span>
                <span style={{fontSize:8,color:"#6a6a7a",flex:1}}>{se.note}</span>
                <button onClick={()=>{if(!propEdges.some(e=>e.s===paperId&&e.t===se.t))setPropEdges(prev=>[...prev,{s:paperId,t:se.t,type:se.type,note:se.note}]);}} style={{...sty.btn,padding:"2px 8px",background:"rgba(76,175,80,0.1)",color:"#66BB6A",fontSize:8}}>{"\u002B"} Accept</button>
              </div>)}
            </div>}
          </div>}
        </div>}
      </div>
      <div style={sty.footer}>
        {step===0&&<><button onClick={onClose} style={{...sty.btn,background:"rgba(255,255,255,0.04)",color:"#6a6a7a"}}>Cancel</button>
          <button onClick={()=>setStep(1)} disabled={!title||!authors||!desc} style={{...sty.btn,background:title&&authors&&desc?"rgba(171,71,188,0.2)":"rgba(255,255,255,0.04)",color:title&&authors&&desc?"#CE93D8":"#4a4a5a"}}>Next: Add Edges {"\u2192"}</button></>}
        {step===1&&<><button onClick={()=>setStep(0)} style={{...sty.btn,background:"rgba(255,255,255,0.04)",color:"#6a6a7a"}}>{"\u2190"} Back</button>
          <button onClick={runReview} disabled={propEdges.length<1} style={{...sty.btn,background:propEdges.length>=1?"rgba(171,71,188,0.2)":"rgba(255,255,255,0.04)",color:propEdges.length>=1?"#CE93D8":"#4a4a5a"}}>Submit for Review {"\u{1F9E0}"}</button></>}
        {step===3&&<><button onClick={()=>setStep(1)} style={{...sty.btn,background:"rgba(255,255,255,0.04)",color:"#6a6a7a"}}>{"\u2190"} Edit Edges</button>
          <button onClick={handleAdd} style={{...sty.btn,background:"rgba(76,175,80,0.2)",color:"#66BB6A"}}>Add to Graph {"\u2713"}</button></>}
      </div>
    </div>
  </div>);
}

export default function App(){
  const svgRef=useRef(null),wrapRef=useRef(null),d3Ref=useRef({nk:null,lk:null}),tourIdRef=useRef(null);
  const [sel,setSel]=useState(null),[hov,setHov]=useState(null);
  const [fDom,setFDom]=useState(null),[fCase,setFCase]=useState(null),[fTier,setFTier]=useState(null),[fEdge,setFEdge]=useState(null);
  const [searchQ,setSearchQ]=useState(""),[searchOpen,setSearchOpen]=useState(false);
  const [maxYr,setMaxYr]=useState(null);
  const [dims,setDims]=useState({w:800,h:640});
  const [tourId,setTourId]=useState(null),[tourStep,setTourStep]=useState(0),[tab,setTab]=useState("filters");
  const [warRoom,setWarRoom]=useState(false),[sprintCase,setSprintCase]=useState(null);
  const [viewMode,setViewMode]=useState("ring"); // "ring" | "graph"
  const [expandedConcept,setExpandedConcept]=useState(null); // concept id | null
  const [rightPanel,setRightPanel]=useState(true);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<640);
  const [showStudentPapers,setShowStudentPapers]=useState(false);
  const [studentPapers,setStudentPapers]=useState([]);
  const [promotedPapers,setPromotedPapers]=useState([]);
  const [proposalOpen,setProposalOpen]=useState(false);
  const [showAbout,setShowAbout]=useState(true);
  const [storageReady,setStorageReady]=useState(false);
  const [adminAuth,setAdminAuth]=useState(false);
  const [adminPrompt,setAdminPrompt]=useState(null); // {action:"clearAll"|"remove"|"promote", paperId?}
  const [adminPw,setAdminPw]=useState("");
  const [adminErr,setAdminErr]=useState(false);
  const ADMIN_PW="bookangiskorean";
  // Load student papers and promoted papers from storage
  useEffect(()=>{
    if(!window.storage){setStorageReady(true);return;}
    (async()=>{try{
      const r=await window.storage.get("gm_student_papers",true);if(r&&r.value){setStudentPapers(JSON.parse(r.value));}
    }catch(e){}
    try{
      const r2=await window.storage.get("gm_promoted_papers",true);if(r2&&r2.value){setPromotedPapers(JSON.parse(r2.value));}
    }catch(e){}
    setStorageReady(true);})();
  },[]);
  // Save student papers to storage
  const saveStudentPapers=async(papers)=>{
    setStudentPapers(papers);
    if(!window.storage)return;
    try{await window.storage.set("gm_student_papers",JSON.stringify(papers),true);}catch(e){console.error("Storage save failed:",e);}
  };
  const savePromotedPapers=async(papers)=>{
    setPromotedPapers(papers);
    if(!window.storage)return;
    try{await window.storage.set("gm_promoted_papers",JSON.stringify(papers),true);}catch(e){console.error("Storage save failed:",e);}
  };
  const execAdminAction=(action,paperId)=>{
    if(action==="clearAll"){saveStudentPapers([]);setShowStudentPapers(false);}
    else if(action==="remove"){saveStudentPapers(studentPapers.filter(p=>p.id!==paperId));setSel(null);}
    else if(action.startsWith("promote_")){
      const tier=action.replace("promote_","");
      const paper=studentPapers.find(p=>p.id===paperId);
      if(paper){savePromotedPapers([...promotedPapers,{...paper,tier,promotedAt:new Date().toISOString()}]);saveStudentPapers(studentPapers.filter(p=>p.id!==paperId));setSel(null);}
    }
    else if(action==="demote"){
      const paper=promotedPapers.find(p=>p.id===paperId);
      if(paper){const{promotedAt,...rest}=paper;saveStudentPapers([...studentPapers,rest]);savePromotedPapers(promotedPapers.filter(p=>p.id!==paperId));setSel(null);}
    }
    else if(action==="clearPromoted"){savePromotedPapers([]);}
    setAdminPrompt(null);
  };
  const requestAdmin=(action,paperId)=>{
    if(adminAuth){execAdminAction(action,paperId);return;}
    setAdminPrompt({action,paperId});setAdminPw("");setAdminErr(false);
  };
  const allNodeData=useMemo(()=>[...baseNodeData,...promotedPapers.map(p=>({id:p.id,type:"paper",label:p.short||p.title,short:p.short||p.title,full:p.full||p.title,domain:p.domain,tier:p.tier,cases:p.cases||[],yr:p.yr,promoted:true})),...(showStudentPapers?studentPapers.map(p=>({id:p.id,type:"paper",label:p.short||p.title,short:p.short||p.title,full:p.full||p.title,domain:p.domain,tier:p.tier,cases:p.cases||[],yr:p.yr,student:true})):[])],[studentPapers,showStudentPapers,promotedPapers]);
  useEffect(()=>{tourIdRef.current=tourId;},[tourId]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape")setShowAbout(false);};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<640);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const activeTour=useMemo(()=>tours.find(t=>t.id===tourId)||null,[tourId]);
  const fullGraph=useMemo(()=>buildGraph(fDom,fCase,fTier,fEdge,maxYr,warRoom,sprintCase,studentPapers,showStudentPapers,promotedPapers),[fDom,fCase,fTier,fEdge,maxYr,warRoom,sprintCase,studentPapers,showStudentPapers,promotedPapers]);
  const activeGraph=useMemo(()=>{
    if(expandedConcept&&viewMode==="graph"&&!tourId&&!warRoom)return buildNeighborhoodGraph(expandedConcept,fullGraph);
    return fullGraph;
  },[fullGraph,expandedConcept,viewMode,tourId,warRoom]);

  const conceptPaperCounts=useMemo(()=>{
    const counts={};const paperIds=new Set(fullGraph.nodes.filter(n=>n.type==="paper").map(n=>n.id));
    concepts.forEach(c=>{let count=0;const allE=[...edges,...(promotedPapers||[]).flatMap(p=>p.edges||[]),...(showStudentPapers?(studentPapers||[]).flatMap(p=>p.edges||[]):[])];allE.forEach(e=>{if(e.s===c.id&&paperIds.has(e.t))count++;if(e.t===c.id&&paperIds.has(e.s))count++;});counts[c.id]=count;});
    return counts;
  },[fullGraph,promotedPapers,studentPapers,showStudentPapers]);

  // Bug fix: clear stale selection when active graph changes
  useEffect(()=>{
    if(sel&&!activeGraph.nodes.find(n=>n.id===sel.id))setSel(null);
  },[activeGraph]);

  useEffect(()=>{
    if(!wrapRef.current)return;
    const obs=new ResizeObserver(entries=>{for(const e of entries){const w=Math.max(400,e.contentRect.width),h=Math.max(400,e.contentRect.height);setDims({w,h});}});
    obs.observe(wrapRef.current);return()=>obs.disconnect();
  },[]);

  // ═══ RING VIEW RENDERING ═══
  useEffect(()=>{
    if(!svgRef.current)return;
    if(viewMode!=="ring")return;
    const svg=d3.select(svgRef.current);svg.selectAll("*").remove();
    const{w,h}=dims;
    const cx=w/2,cy=h/2,ringR=Math.min(w,h)*0.35;
    const g=svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.4,4]).on("zoom",e=>g.attr("transform",e.transform)));
    // Defs
    const defs=svg.append("defs");
    const fl=defs.append("filter").attr("id","glow").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    fl.append("feGaussianBlur").attr("stdDeviation","5").attr("result","b");
    const fm=fl.append("feMerge");fm.append("feMergeNode").attr("in","b");fm.append("feMergeNode").attr("in","SourceGraphic");
    Object.entries(ET).forEach(([k,v])=>{defs.append("marker").attr("id","a-"+k).attr("viewBox","0 -3 6 6").attr("refX",6).attr("refY",0).attr("markerWidth",5).attr("markerHeight",5).attr("orient","auto").append("path").attr("d","M0,-3L6,0L0,3").attr("fill",v.color+"88");});
    // Compute ring positions
    const n=ringConcepts.length;
    const cpos=ringConcepts.map((c,i)=>{
      const angle=(2*Math.PI*i)/n-Math.PI/2;
      return{...c,x:cx+ringR*Math.cos(angle),y:cy+ringR*Math.sin(angle),angle,type:"concept",r:32,color:DOM[c.domain].color};
    });
    const posMap=new Map(cpos.map(c=>[c.id,c]));
    // Concept-concept edges (curved)
    const ccEdges=edges.filter(e=>e.s.startsWith("c_")&&e.t.startsWith("c_")&&posMap.has(e.s)&&posMap.has(e.t));
    const lk=g.append("g").attr("class","cc-edges").selectAll("path").data(ccEdges).join("path")
      .attr("d",e=>{const s=posMap.get(e.s),t=posMap.get(e.t);const mx=(s.x+t.x)/2*0.55+cx*0.45,my=(s.y+t.y)/2*0.55+cy*0.45;return"M"+s.x+","+s.y+" Q"+mx+","+my+" "+t.x+","+t.y;})
      .attr("fill","none").attr("stroke",e=>ET[e.type]?ET[e.type].color+"25":"#33333325").attr("stroke-width",0.8)
      .attr("stroke-dasharray",e=>ET[e.type]?.dash||"none");
    // Concept nodes
    const nk=g.append("g").attr("class","ring-concepts").selectAll("g").data(cpos).join("g")
      .attr("transform",d=>"translate("+d.x+","+d.y+")").style("cursor","pointer");
    // Outer halo
    nk.append("circle").attr("r",d=>d.r+4).attr("fill",d=>d.color+"08").attr("stroke",d=>d.color+"33").attr("stroke-width",1);
    // Inner circle
    nk.append("circle").attr("r",d=>d.r).attr("fill",d=>d.color+"30").attr("stroke",d=>d.color).attr("stroke-width",2.5).attr("filter","url(#glow)")
      .attr("opacity",d=>conceptPaperCounts[d.id]>0?1:0.3);
    // Labels
    nk.each(function(d){const lines=d.label.split("\n"),s=d3.select(this);lines.forEach((line,i)=>{s.append("text").text(line).attr("text-anchor","middle").attr("dy",(i-(lines.length-1)/2)*13+1).attr("fill","#f0e6d8").attr("font-size","10px").attr("font-weight","700").attr("font-family","system-ui,sans-serif").attr("pointer-events","none");});});
    // Paper count badge
    nk.append("text").text(d=>{const c=conceptPaperCounts[d.id];return c>0?c+" paper"+(c>1?"s":""):"";}).attr("text-anchor","middle").attr("dy",d=>d.r+16).attr("fill","#5a5a6a").attr("font-size","7px").attr("font-family","system-ui,sans-serif").attr("pointer-events","none");
    // Entrance animation
    nk.style("opacity",0).transition().delay((_,i)=>i*35).duration(400).style("opacity",1);
    lk.style("opacity",0).transition().delay(400).duration(600).style("opacity",1);
    // Concept hover
    nk.on("mouseenter",function(ev,d){
      setHov(d);
      const conn=new Set();ccEdges.forEach(e=>{if(e.s===d.id)conn.add(e.t);if(e.t===d.id)conn.add(e.s);});
      nk.selectAll("circle").transition().duration(150).attr("opacity",nd=>(nd.id===d.id||conn.has(nd.id))?1:0.15);
      nk.selectAll("text").transition().duration(150).attr("opacity",nd=>(nd.id===d.id||conn.has(nd.id))?1:0.15);
      lk.transition().duration(150).style("opacity",e=>(e.s===d.id||e.t===d.id)?0.7:0.03);
    }).on("mouseleave",function(){
      setHov(null);
      nk.selectAll("circle").transition().duration(250).attr("opacity",d=>conceptPaperCounts[d.id]>0?1:0.3);
      nk.selectAll("text").transition().duration(250).attr("opacity",1);
      lk.transition().duration(250).style("opacity",1);
    }).on("click",(ev,d)=>{
      ev.stopPropagation();
      // Transition into focused force graph for this concept's neighborhood
      setExpandedConcept(d.id);
      setViewMode("graph");
      setSel(d);setRightPanel(true);
    });
    svg.on("click",()=>{setSel(null);});
    d3Ref.current={nk,lk};
  },[viewMode,dims,fullGraph,conceptPaperCounts]);

  // ═══ FORCE GRAPH RENDERING ═══
  useEffect(()=>{
    if(!svgRef.current||activeGraph.nodes.length===0||viewMode!=="graph") return;
    const svg=d3.select(svgRef.current);svg.selectAll("*").remove();
    const{w,h}=dims,nd=activeGraph.nodes.map(d=>({...d})),ld=activeGraph.links.map(d=>({...d}));
    const isNeighborhood=expandedConcept!==null;
    const g=svg.append("g");
    const zoom=d3.zoom().scaleExtent([0.2,6]).on("zoom",e=>g.attr("transform",e.transform));
    svg.call(zoom);
    const defs=svg.append("defs");
    const fl=defs.append("filter").attr("id","glow").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    fl.append("feGaussianBlur").attr("stdDeviation","5").attr("result","b");
    const fm=fl.append("feMerge");fm.append("feMergeNode").attr("in","b");fm.append("feMergeNode").attr("in","SourceGraphic");
    // Selected concept glow (stronger)
    const flSel=defs.append("filter").attr("id","glow-selected").attr("x","-60%").attr("y","-60%").attr("width","220%").attr("height","220%");
    flSel.append("feGaussianBlur").attr("stdDeviation","8").attr("result","b");
    const fmSel=flSel.append("feMerge");fmSel.append("feMergeNode").attr("in","b");fmSel.append("feMergeNode").attr("in","SourceGraphic");
    // Pulse animation for selected concept
    if(expandedConcept){svg.append("style").text("@keyframes conceptPulse{0%,100%{stroke-width:3.5px}50%{stroke-width:4.5px}}.sel-pulse{animation:conceptPulse 2.4s ease-in-out infinite}");}
    Object.entries(ET).forEach(([k,v])=>{defs.append("marker").attr("id","a-"+k).attr("viewBox","0 -3 6 6").attr("refX",6).attr("refY",0).attr("markerWidth",5).attr("markerHeight",5).attr("orient","auto").append("path").attr("d","M0,-3L6,0L0,3").attr("fill",v.color+"88");});
    // Lever glow
    const fl2=defs.append("filter").attr("id","glow-lever").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    fl2.append("feGaussianBlur").attr("stdDeviation","4").attr("result","b");fl2.append("feFlood").attr("flood-color","#00E5FF").attr("flood-opacity","0.25").attr("result","c");
    fl2.append("feComposite").attr("in","c").attr("in2","b").attr("operator","in").attr("result","d");const fm2=fl2.append("feMerge");fm2.append("feMergeNode").attr("in","d");fm2.append("feMergeNode").attr("in","SourceGraphic");
    // Constraint glow
    const fl3=defs.append("filter").attr("id","glow-con").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    fl3.append("feGaussianBlur").attr("stdDeviation","4").attr("result","b");fl3.append("feFlood").attr("flood-color","#FF1744").attr("flood-opacity","0.25").attr("result","c");
    fl3.append("feComposite").attr("in","c").attr("in2","b").attr("operator","in").attr("result","d");const fm3=fl3.append("feMerge");fm3.append("feMergeNode").attr("in","d");fm3.append("feMergeNode").attr("in","SourceGraphic");
    const lk=g.append("g").selectAll("line").data(ld).join("line").attr("stroke",d=>d.student?"#AB47BC66":ET[d.type]?ET[d.type].color+(ET[d.type].group==="warroom"?"88":"44"):"#44444444").attr("stroke-width",d=>{if(d.student)return 1.2;if(ET[d.type]&&ET[d.type].group==="warroom")return 2;return d.type==="foundational"?1.5:d.type==="causes"?1.2:0.8;}).attr("stroke-dasharray",d=>d.student?"4,3":(ET[d.type]?ET[d.type].dash:null)).attr("marker-end",d=>"url(#a-"+d.type+")");
    const nk=g.append("g").selectAll("g").data(nd).join("g").style("cursor","pointer");
    nk.filter(d=>d.type==="concept").append("circle").attr("r",d=>d.r+4).attr("fill",d=>expandedConcept&&d.id===expandedConcept?d.color+"18":d.color+"08").attr("stroke",d=>expandedConcept&&d.id===expandedConcept?d.color+"66":d.color+"33").attr("stroke-width",d=>expandedConcept&&d.id===expandedConcept?2:1);
    nk.filter(d=>d.type==="concept").append("circle").attr("r",d=>d.r).attr("fill",d=>expandedConcept&&d.id===expandedConcept?d.color+"50":d.color+"30").attr("stroke",d=>d.color).attr("stroke-width",d=>expandedConcept&&d.id===expandedConcept?4:2.5).attr("filter",d=>expandedConcept&&d.id===expandedConcept?"url(#glow-selected)":"url(#glow)").classed("sel-pulse",d=>expandedConcept&&d.id===expandedConcept);
    nk.filter(d=>d.type==="paper"&&!d.student).append("circle").attr("r",d=>d.r).attr("fill",d=>d.tier==="spine"?d.color+"dd":d.tier==="frontier"?d.color+"88":"#16161e").attr("stroke",d=>d.color).attr("stroke-width",d=>d.sw||1).attr("opacity",d=>d.op||0.6);
    nk.filter(d=>d.type==="paper"&&d.student).append("circle").attr("r",d=>d.r).attr("fill","#16161e").attr("stroke",d=>d.color).attr("stroke-width",1.5).attr("stroke-dasharray","3,2").attr("opacity",0.7);
    nk.filter(d=>d.type==="paper"&&d.student).append("text").text("\u2709").attr("text-anchor","middle").attr("dy",d=>-(d.r+4)).attr("font-size","7px").attr("fill","#AB47BC").attr("pointer-events","none");
    // Lever hexagons
    nk.filter(d=>d.type==="lever").append("path").attr("d",d=>hexPath(d.r)).attr("fill","#00E5FF18").attr("stroke","#00E5FF").attr("stroke-width",2).attr("filter","url(#glow-lever)");
    // Constraint diamonds
    nk.filter(d=>d.type==="constraint").append("path").attr("d",d=>diamondPath(d.r)).attr("fill","#FF174418").attr("stroke","#FF1744").attr("stroke-width",2).attr("filter","url(#glow-con)");
    nk.filter(d=>d.type==="concept").each(function(d){const lines=d.label.split("\n"),s=d3.select(this);lines.forEach((line,i)=>{s.append("text").text(line).attr("text-anchor","middle").attr("dy",(i-(lines.length-1)/2)*13+1).attr("fill","#f0e6d8").attr("font-size","10px").attr("font-weight","700").attr("font-family","system-ui,sans-serif").attr("pointer-events","none");});});
    nk.filter(d=>d.type==="paper").append("text").text(d=>d.label).attr("text-anchor","middle").attr("dy",d=>d.r+11).attr("fill",d=>d.tier==="spine"?"rgba(230,220,210,0.85)":"rgba(180,180,190,0.6)").attr("font-size",d=>d.tier==="spine"?"9px":"7.5px").attr("font-weight",d=>d.tier==="spine"?"600":"400").attr("font-family","system-ui,sans-serif").attr("pointer-events","none");
    // Lever + constraint labels (inside shape)
    nk.filter(d=>d.type==="lever"||d.type==="constraint").each(function(d){const lines=d.label.split("\n"),s=d3.select(this);lines.forEach((line,i)=>{s.append("text").text(line).attr("text-anchor","middle").attr("dy",(i-(lines.length-1)/2)*11+1).attr("fill",d.type==="lever"?"#B2EBF2":"#FFCDD2").attr("font-size","8px").attr("font-weight","700").attr("font-family","system-ui,sans-serif").attr("pointer-events","none");});});
    nk.call(d3.drag().on("start",(ev,d)=>{if(!ev.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;}).on("drag",(ev,d)=>{d.fx=ev.x;d.fy=ev.y;}).on("end",(ev,d)=>{if(!ev.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
    nk.on("mouseenter",function(ev,d){
      if(tourIdRef.current)return;setHov(d);
      const conn=new Set();ld.forEach(l=>{const s=typeof l.source==="object"?l.source.id:l.source,t=typeof l.target==="object"?l.target.id:l.target;if(s===d.id)conn.add(t);if(t===d.id)conn.add(s);});
      nk.selectAll("circle,path").transition().duration(150).attr("opacity",n=>(n.id===d.id||conn.has(n.id))?1:0.06);
      nk.selectAll("text").transition().duration(150).attr("opacity",n=>(n.id===d.id||conn.has(n.id))?1:0.06);
      lk.transition().duration(150).attr("opacity",l=>{const s=typeof l.source==="object"?l.source.id:l.source,t=typeof l.target==="object"?l.target.id:l.target;return(s===d.id||t===d.id)?1:0.02;}).attr("stroke-width",l=>{const s=typeof l.source==="object"?l.source.id:l.source,t=typeof l.target==="object"?l.target.id:l.target;return(s===d.id||t===d.id)?2.5:0.5;});
      d3.select(this).select("circle,path").transition().duration(150).attr("stroke-width",3);
    }).on("mouseleave",function(ev,d){
      if(tourIdRef.current)return;setHov(null);
      nk.selectAll("circle,path").transition().duration(250).attr("opacity",n=>(n.type==="concept"||n.type==="lever"||n.type==="constraint")?1:(n.op||0.6)).attr("stroke-width",n=>n.type==="concept"?(expandedConcept&&n.id===expandedConcept?4:2):n.type==="lever"?2:n.type==="constraint"?2:(n.sw||1));
      nk.selectAll("circle").transition().duration(250).attr("r",n=>n.r);
      nk.selectAll("text").transition().duration(250).attr("opacity",1);
      lk.transition().duration(250).attr("opacity",1).attr("stroke-width",l=>{if(ET[l.type]&&ET[l.type].group==="warroom")return 2;return l.type==="foundational"?1.5:l.type==="causes"?1.2:0.8;});
    }).on("click",(ev,d)=>{
      ev.stopPropagation();
      // Browsable: clicking a concept in neighborhood mode re-focuses on it
      if(d.type==="concept"&&isNeighborhood){setExpandedConcept(d.id);setSel(d);setRightPanel(true);return;}
      setSel(prev=>(prev&&prev.id===d.id)?null:d);setRightPanel(true);
    });
    svg.on("click",()=>{setSel(null);});
    // Simulation forces — tuned for neighborhood (fewer nodes) vs full graph
    const sim=d3.forceSimulation(nd).force("link",d3.forceLink(ld).id(d=>d.id).distance(d=>{const sn=nd.find(n=>n.id===(typeof d.source==="object"?d.source.id:d.source)),tn=nd.find(n=>n.id===(typeof d.target==="object"?d.target.id:d.target));if(sn&&tn&&sn.type==="concept"&&tn.type==="concept")return isNeighborhood?120:160;if(ET[d.type]&&ET[d.type].group==="warroom")return 90;return d.type==="foundational"?(isNeighborhood?60:70):(isNeighborhood?80:110);}).strength(d=>{if(ET[d.type]&&ET[d.type].group==="warroom")return 0.4;return d.type==="foundational"?(isNeighborhood?0.6:0.5):d.type==="causes"?0.15:0.12;})).force("charge",d3.forceManyBody().strength(d=>{if(d.type==="lever")return -350;if(d.type==="constraint")return -300;return d.type==="concept"?(isNeighborhood?-400:-500):d.tier==="spine"?(isNeighborhood?-120:-150):(isNeighborhood?-50:-60);})).force("center",d3.forceCenter(w/2,h/2).strength(isNeighborhood?0.08:0.04)).force("collide",d3.forceCollide().radius(d=>d.r+(isNeighborhood?12:8)).strength(0.8)).force("x",d3.forceX(w/2).strength(isNeighborhood?0.05:0.025)).force("y",d3.forceY(h/2).strength(isNeighborhood?0.05:0.025));
    // Build radius lookup for line shortening
    const rMap=new Map();nd.forEach(n=>rMap.set(n.id,n.r));
    sim.on("tick",()=>{lk.each(function(d){const sx=d.source.x,sy=d.source.y,tx=d.target.x,ty=d.target.y;const dx=tx-sx,dy=ty-sy,dist=Math.sqrt(dx*dx+dy*dy)||1;const sr=rMap.get(d.source.id)||8,tr=rMap.get(d.target.id)||8;const pad=4;const nx=dx/dist,ny=dy/dist;d3.select(this).attr("x1",sx+nx*(sr+pad)).attr("y1",sy+ny*(sr+pad)).attr("x2",tx-nx*(tr+pad)).attr("y2",ty-ny*(tr+pad));});nk.attr("transform",d=>"translate("+d.x+","+d.y+")");});
    d3Ref.current={nk,lk};
    // Gentle zoom for neighborhood view — center on focus concept
    if(isNeighborhood){
      setTimeout(()=>{
        const focusNode=nd.find(n=>n.id===expandedConcept);
        if(focusNode){
          const scale=1.5;
          const tx=w/2-focusNode.x*scale,ty=h/2-focusNode.y*scale;
          svg.transition().duration(800).ease(d3.easeCubicInOut).call(zoom.transform,d3.zoomIdentity.translate(tx,ty).scale(scale));
        }
      },600);
    }
    return()=>sim.stop();
  },[activeGraph,dims,viewMode]);

  useEffect(()=>{
    if(viewMode!=="graph")return;
    const run=()=>{
    const{nk,lk}=d3Ref.current;if(!nk||!lk)return;
    if(!tourId||!activeTour){nk.selectAll("circle,path").transition().duration(300).attr("opacity",n=>(n.type==="concept"||n.type==="lever"||n.type==="constraint")?1:(n.op||0.6)).attr("stroke-width",n=>n.type==="concept"?2:n.type==="lever"?2:n.type==="constraint"?2:(n.sw||1));nk.selectAll("circle").transition().duration(300).attr("r",n=>n.r);nk.selectAll("text").transition().duration(300).attr("opacity",1);lk.transition().duration(300).attr("opacity",1).attr("stroke-width",l=>{if(ET[l.type]&&ET[l.type].group==="warroom")return 2;return l.type==="foundational"?1.5:l.type==="causes"?1.2:0.8;});return;}
    const visited=new Set(activeTour.stops.slice(0,tourStep+1).map(s=>s.nid)),cur=activeTour.stops[tourStep].nid;
    nk.selectAll("circle,path").transition().duration(300).attr("opacity",n=>visited.has(n.id)?1:0.06);
    nk.selectAll("text").transition().duration(300).attr("opacity",n=>visited.has(n.id)?1:0.06);
    lk.transition().duration(300).attr("opacity",l=>{const s=typeof l.source==="object"?l.source.id:l.source,t=typeof l.target==="object"?l.target.id:l.target;return(visited.has(s)&&visited.has(t))?0.8:0.02;}).attr("stroke-width",l=>{const s=typeof l.source==="object"?l.source.id:l.source,t=typeof l.target==="object"?l.target.id:l.target;return(visited.has(s)&&visited.has(t))?2.5:0.5;});
    nk.filter(n=>n.id===cur).selectAll("circle,path").transition().duration(300).attr("stroke-width",4).transition().duration(600).attr("stroke-width",3);
    };
    const raf=requestAnimationFrame(run);return()=>cancelAnimationFrame(raf);
  },[tourId,tourStep,activeTour,activeGraph,dims,viewMode]);

  const clr=()=>{setFDom(null);setFCase(null);setFTier(null);setFEdge(null);setMaxYr(null);setSel(null);setSprintCase(null);setExpandedConcept(null);};
  const af=fDom||fCase||fTier||fEdge||maxYr;
  const det=tourId?null:(sel||hov);
  const allEdges=useMemo(()=>{const pe=promotedPapers.flatMap(p=>p.edges||[]);const se=showStudentPapers?studentPapers.flatMap(p=>p.edges||[]):[];return[...edges,...warEdges,...pe,...se];},[studentPapers,showStudentPapers,promotedPapers]);
  const detEdges=useMemo(()=>{if(!det)return[];const graphIds=new Set(fullGraph.nodes.map(n=>n.id));return allEdges.filter(e=>e.s===det.id||e.t===det.id).map(e=>{const oid=e.s===det.id?e.t:e.s,on=allNodeData.find(n=>n.id===oid);return{...e,otherLabel:on?(on.short||on.label.replace("\n"," ")):oid,dir:e.s===det.id?"out":"in",inGraph:graphIds.has(oid)};}).filter(e=>e.inGraph);},[det,fullGraph,allEdges,allNodeData]);
  const tourStopLabel=useMemo(()=>{if(!activeTour)return"";const s=activeTour.stops[tourStep];if(!s)return"";const n=allNodeData.find(x=>x.id===s.nid);return n?(n.short||n.label.replace("\n"," ")):""},[activeTour,tourStep]);
  const yrPaperCount=useMemo(()=>maxYr?papers.filter(p=>p.yr<=maxYr).length:papers.length,[maxYr]);
  const searchResults=useMemo(()=>{
    if(!searchQ||searchQ.length<2)return[];
    const q=searchQ.toLowerCase();
    return allNodeData.filter(n=>{
      const hay=[n.label,n.short,n.full,n.desc,n.id].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    }).slice(0,12).map(n=>({id:n.id,label:n.short||n.label.replace("\n"," "),type:n.type||"concept",yr:n.yr,student:!!n.student,inGraph:fullGraph.nodes.some(gn=>gn.id===n.id)}));
  },[searchQ,fullGraph,allNodeData]);
  // Country Sprint data
  const sprintData=useMemo(()=>{
    if(!sprintCase)return null;
    const cL=(countryLevers[sprintCase]||[]).map(id=>levers.find(l=>l.id===id)).filter(Boolean);
    const cC=(countryConstraints[sprintCase]||[]).map(id=>wrConstraints.find(c=>c.id===id)).filter(Boolean);
    const cP=papers.filter(p=>p.cases.includes(sprintCase));
    const ma=new Set(),mb=new Set();
    warEdges.forEach(e=>{if(e.type==="activates"&&(countryLevers[sprintCase]||[]).includes(e.s))ma.add(e.t);if(e.type==="blocks"&&(countryConstraints[sprintCase]||[]).includes(e.s))mb.add(e.t);});
    const mechs=concepts.filter(c=>ma.has(c.id)||mb.has(c.id)).map(c=>({...c,activated:ma.has(c.id),blocked:mb.has(c.id)}));
    return{levers:cL,constraints:cC,papers:cP,mechanisms:mechs};
  },[sprintCase]);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",width:"100%",background:"#0b0c10",color:"#d0d0da",fontFamily:"system-ui,-apple-system,sans-serif",overflow:"hidden"}}>
      <div style={{padding:"14px 22px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:warRoom?"linear-gradient(180deg,rgba(0,229,255,0.04) 0%,transparent 100%)":"linear-gradient(180deg,rgba(232,168,56,0.04) 0%,transparent 100%)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12}}>
          <span style={{fontSize:22,fontWeight:700,color:warRoom?"#B2EBF2":"#f0e6d8"}}>Growth Miracles</span>
          <button onClick={()=>setShowAbout(true)} style={{width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#5a5a6a",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"inherit",lineHeight:1,flexShrink:0}}>{"\u2139"}</button>
          <span style={{fontSize:11,color:"#555",fontWeight:500}}>{warRoom?"War Room":"Knowledge Bank"}</span>
          <div style={{position:"relative",marginLeft:12,flex:"0 1 220px"}}><input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)} onBlur={()=>setTimeout(()=>setSearchOpen(false),200)} placeholder="Search papers, concepts..." style={{width:"100%",padding:"4px 10px 4px 26px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#d0d0da",fontSize:10,fontFamily:"inherit",outline:"none"}}/><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#4a4a5a",pointerEvents:"none"}}>{"\uD83D\uDD0D"}</span>{searchOpen&&searchResults.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:"#1a1b22",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,maxHeight:280,overflowY:"auto",zIndex:50,boxShadow:"0 8px 24px rgba(0,0,0,0.6)"}}>{searchResults.map(r=><div key={r.id} onMouseDown={e=>{e.preventDefault();setSearchQ("");setSearchOpen(false);if(viewMode==="ring"){if(r.type==="concept"){setExpandedConcept(r.id);setViewMode("graph");const cn=allNodeData.find(nn=>nn.id===r.id);if(cn)setSel(cn);setRightPanel(true);}else{const ce=edges.find(ed=>(ed.s===r.id&&ed.t.startsWith("c_"))||(ed.t===r.id&&ed.s.startsWith("c_")));if(ce){const cid=ce.s.startsWith("c_")?ce.s:ce.t;setExpandedConcept(cid);}setViewMode("graph");const pn=allNodeData.find(nn=>nn.id===r.id);if(pn){setSel(pn);setRightPanel(true);}}}else{const n=fullGraph.nodes.find(nn=>nn.id===r.id);if(n){setSel(n);}else{setFDom(null);setFCase(null);setFTier(null);setFEdge(null);setMaxYr(null);setTimeout(()=>{const n2=allNodeData.find(nn=>nn.id===r.id);if(n2)setSel(n2);},100);}}}} style={{padding:"6px 10px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span style={{fontSize:7,padding:"1px 5px",borderRadius:3,background:r.type==="concept"?"rgba(232,168,56,0.15)":r.type==="lever"?"rgba(0,229,255,0.15)":r.type==="constraint"?"rgba(255,23,68,0.15)":r.student?"rgba(171,71,188,0.15)":"rgba(255,255,255,0.06)",color:r.type==="concept"?"#E8A838":r.type==="lever"?"#00E5FF":r.type==="constraint"?"#FF1744":r.student?"#CE93D8":"#8a8a9a",fontWeight:700,textTransform:"uppercase",flexShrink:0}}>{r.type==="concept"?"C":r.type==="lever"?"L":r.type==="constraint"?"B":r.student?"S":"P"}</span><span style={{fontSize:10,color:r.inGraph?"#d0d0da":"#5a5a6a"}}>{r.label}</span>{r.yr&&<span style={{fontSize:9,color:"#3a3a4a",marginLeft:"auto"}}>{r.yr}</span>}{!r.inGraph&&<span style={{fontSize:7,color:"#4a4a5a",fontStyle:"italic"}}>filtered</span>}</div>)}</div>}</div>
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            {studentPapers.length>0&&<button onClick={()=>setShowStudentPapers(p=>!p)} style={{padding:"4px 12px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:showStudentPapers?"rgba(171,71,188,0.15)":"rgba(171,71,188,0.05)",border:"1px solid "+(showStudentPapers?"rgba(171,71,188,0.3)":"rgba(171,71,188,0.1)"),color:showStudentPapers?"#CE93D8":"#8a6a9a"}}>{showStudentPapers?"\u25C9":"\u25CB"} {studentPapers.length} Pending</button>}
            <button onClick={()=>setProposalOpen(true)} style={{padding:"4px 12px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:"rgba(171,71,188,0.08)",border:"1px solid rgba(171,71,188,0.2)",color:"#CE93D8"}}>{"\u002B"} Propose Paper</button>
            <button onClick={()=>{const nw=!warRoom;setWarRoom(nw);setSprintCase(null);setSel(null);setViewMode(nw?"graph":"ring");setExpandedConcept(null);}} style={{padding:"4px 12px",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:warRoom?"rgba(0,229,255,0.15)":"rgba(255,23,68,0.08)",border:warRoom?"1px solid rgba(0,229,255,0.3)":"1px solid rgba(255,23,68,0.15)",color:warRoom?"#00E5FF":"#FF1744"}}>{warRoom?"\u25C9 War Room ON":"\u25CB War Room"}</button>
          </div>
        </div>
        <div style={{fontSize:10,color:"#4a4a5a",marginTop:2}}>{concepts.length} concepts &middot; {papers.length} papers &middot; {edges.length} edges{warRoom?<span style={{color:"#00E5FF",marginLeft:8}}>{levers.length} levers &middot; {wrConstraints.length} constraints</span>:null}{showStudentPapers&&studentPapers.length>0?<span style={{color:"#AB47BC",marginLeft:8}}>{studentPapers.length} pending</span>:null}{promotedPapers.length>0?<span style={{color:"#66BB6A",marginLeft:8}}>{promotedPapers.length} promoted</span>:null}</div>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative"}}>
        <div style={{width:215,minWidth:215,padding:"8px 10px",borderRight:"1px solid rgba(255,255,255,0.04)",overflowY:"auto",flexShrink:0}}>
          <div style={{display:"flex",gap:2,marginBottom:10}}>
            {["filters","tours"].map(k=><button key={k} onClick={()=>{setTab(k);if(k==="filters"){setTourId(null);setTourStep(0);setViewMode("ring");}}} style={{flex:1,padding:"6px 0",borderRadius:5,background:tab===k?"rgba(255,255,255,0.07)":"transparent",border:tab===k?"1px solid rgba(255,255,255,0.1)":"1px solid transparent",color:tab===k?"#d0d0da":"#4a4a5a",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{k==="filters"?"Filters":"Guided Tours"}</button>)}
          </div>
          {tab==="filters"&&<div>
            {/* COUNTRY SPRINT (War Room only) */}
            {warRoom&&<div>
              <Lbl>Country Sprint</Lbl>
              <div style={{fontSize:9,color:"#5a5a6a",lineHeight:1.5,marginBottom:6}}>Select a country to see its constraints, levers, and mechanisms.</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{sprintCases.map(c=><Tag key={c} label={c} active={sprintCase===c} ac="rgba(0,229,255,0.25)" onClick={()=>setSprintCase(p=>p===c?null:c)}/>)}</div>
              {sprintCase&&<button onClick={()=>setSprintCase(null)} style={{width:"100%",marginTop:6,padding:"4px 8px",borderRadius:5,background:"rgba(0,229,255,0.06)",border:"1px solid rgba(0,229,255,0.15)",color:"#00E5FF",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>Clear sprint</button>}
              <div style={{borderBottom:"1px solid rgba(255,255,255,0.04)",margin:"10px 0"}}/>
            </div>}
            {/* TIMELINE SLIDER */}
            <Lbl>Timeline</Lbl>
            <div style={{padding:"0 2px"}}>
              <input type="range" min={MIN_YR} max={MAX_YR} value={maxYr||MAX_YR} onChange={e=>{const v=Number(e.target.value);setMaxYr(v>=MAX_YR?null:v);}} style={{width:"100%",accentColor:"#E8A838",cursor:"pointer",height:4}} />
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:maxYr?"#E8A838":"#4a4a5a",marginTop:2}}>
                <span>{MIN_YR}</span>
                <span style={{fontWeight:maxYr?700:400,fontSize:maxYr?12:9}}>{maxYr||"All years"}</span>
                <span>{MAX_YR}</span>
              </div>
              {maxYr&&<div style={{fontSize:9,color:"#6a6a7a",textAlign:"center",marginTop:2}}>{yrPaperCount} papers visible</div>}
              <div style={{display:"flex",gap:2,marginTop:6,flexWrap:"wrap"}}>{ERAS.map(era=>{const active=maxYr&&maxYr>=era.start&&maxYr<=era.end;const past=maxYr&&maxYr>era.end;return <button key={era.label} onClick={()=>setMaxYr(era.end>=MAX_YR?null:era.end)} style={{flex:"1 1 auto",padding:"3px 4px",borderRadius:4,background:active?era.color+"22":past?era.color+"08":"rgba(255,255,255,0.02)",border:"1px solid "+(active?era.color+"55":"rgba(255,255,255,0.04)"),color:active?era.color:past?era.color+"88":"#3a3a4a",fontSize:7,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",lineHeight:1.3,textAlign:"center"}}><div>{era.label}</div><div style={{fontSize:6,opacity:0.7}}>{era.start}–{era.end}</div></button>;})}</div>
            </div>
            <Lbl>Paper Tier</Lbl>
            {Object.entries(TIERS).map(([k,v])=><Btn key={k} active={fTier===k} onClick={()=>setFTier(p=>p===k?null:k)}><span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:v.r*0.7,height:v.r*0.7,borderRadius:"50%",background:k==="spine"?"#E8A838cc":k==="frontier"?"#9b7ed488":"#16161e",border:"1px solid #E8A838",flexShrink:0}}/>{v.label}</span></Btn>)}
            <Lbl>Domain</Lbl>
            <div style={{maxHeight:160,overflowY:"auto"}}>{Object.entries(DOM).map(([k,v])=><Btn key={k} active={fDom===k} onClick={()=>setFDom(p=>p===k?null:k)} c={v.color}><span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:v.color,flexShrink:0}}/>{v.label}</span></Btn>)}</div>
            <Lbl>Edge Type</Lbl>
            {Object.entries(ET).filter(([,v])=>warRoom||v.group==="academic").map(([k,v])=><Btn key={k} active={fEdge===k} onClick={()=>setFEdge(p=>p===k?null:k)} c={v.color}><span style={{display:"flex",alignItems:"center",gap:5}}><svg width={14} height={8}><line x1={0} y1={4} x2={14} y2={4} stroke={v.color} strokeWidth={2} strokeDasharray={v.dash||"none"}/></svg>{v.label}</span></Btn>)}
            <Lbl>Country</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{CASES.map(c=><Tag key={c} label={c} active={fCase===c} ac="rgba(91,212,163,0.25)" onClick={()=>setFCase(p=>p===c?null:c)}/>)}</div>
            {af&&<div style={{marginTop:8}}><button onClick={clr} style={{width:"100%",padding:"5px 10px",borderRadius:5,background:"rgba(212,91,91,0.08)",border:"1px solid rgba(212,91,91,0.15)",color:"#d45b5b",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Clear all</button></div>}
            {(studentPapers.length>0||promotedPapers.length>0)&&<div style={{marginTop:14,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
              <Lbl>Contributions ({studentPapers.length+promotedPapers.length})</Lbl>
              {studentPapers.length>0&&<Btn active={showStudentPapers} onClick={()=>setShowStudentPapers(p=>!p)} c="#AB47BC"><span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",border:"2px dashed #AB47BC",flexShrink:0}}/>{showStudentPapers?"Pending visible":"Pending hidden"} ({studentPapers.length})</span></Btn>}
              {promotedPapers.length>0&&<div style={{fontSize:9,color:"#66BB6A",padding:"3px 9px",marginBottom:2}}>{"\u2713"} {promotedPapers.length} promoted to canonical</div>}
              <button onClick={()=>requestAdmin("clearAll")} style={{width:"100%",marginTop:4,padding:"4px 8px",borderRadius:5,background:"rgba(212,91,91,0.05)",border:"1px solid rgba(212,91,91,0.1)",color:"#d45b5b88",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{"\uD83D\uDD12"} Clear all submissions</button>
              {promotedPapers.length>0&&<button onClick={()=>requestAdmin("clearPromoted")} style={{width:"100%",marginTop:2,padding:"4px 8px",borderRadius:5,background:"rgba(212,91,91,0.03)",border:"1px solid rgba(212,91,91,0.06)",color:"#d45b5b55",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{"\uD83D\uDD12"} Clear promoted papers</button>}
            </div>}
          </div>}
          {tab==="tours"&&<div>
            <div style={{fontSize:10,color:"#5a5a6a",lineHeight:1.5,marginBottom:12}}>Guided tours walk through the intellectual plot lines of the field.</div>
            {tours.map(t=><div key={t.id} onClick={()=>{setTourId(t.id);setTourStep(0);setSel(null);setFDom(null);setFCase(null);setFTier(null);setFEdge(null);setMaxYr(null);setWarRoom(false);setSprintCase(null);setViewMode("graph");setExpandedConcept(null);}} style={{padding:"8px 10px",marginBottom:4,borderRadius:6,background:tourId===t.id?t.color+"18":"rgba(255,255,255,0.02)",border:"1px solid "+(tourId===t.id?t.color+"44":"rgba(255,255,255,0.04)"),cursor:"pointer"}}><div style={{fontSize:12,fontWeight:600,color:tourId===t.id?t.color:"#c0c0ca"}}>{t.title}</div><div style={{fontSize:9,color:"#5a5a6a",marginTop:2}}>{t.sub}</div><div style={{fontSize:8,color:"#3a3a4a",marginTop:3}}>{t.stops.length} stops</div></div>)}
            {tourId&&<button onClick={()=>{setTourId(null);setTourStep(0);setViewMode("ring");}} style={{width:"100%",marginTop:8,padding:"5px 10px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#8a8a9a",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Exit tour</button>}
          </div>}
        </div>
        <div ref={wrapRef} style={{flex:1,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:8,left:12,zIndex:5,display:"flex",gap:12,fontSize:10,color:"#4a4a5a"}}>
            {viewMode==="ring"?<>
              <span><b style={{color:"#d0d0da"}}>{concepts.length}</b> concepts</span>
              <span><b style={{color:"#5a5a6a"}}>{fullGraph.nodes.filter(n=>n.type==="paper").length}</b> papers</span>
            </>:<>
              <span><b style={{color:"#d0d0da"}}>{activeGraph.nodes.filter(n=>n.type==="concept").length}</b> concepts</span>
              <span><b style={{color:"#d0d0da"}}>{activeGraph.nodes.filter(n=>n.type==="paper"&&!n.student).length}</b> papers</span>
              {showStudentPapers&&activeGraph.nodes.some(n=>n.student)&&<span><b style={{color:"#AB47BC"}}>{activeGraph.nodes.filter(n=>n.student).length}</b> pending</span>}
              {warRoom&&<span><b style={{color:"#00E5FF"}}>{activeGraph.nodes.filter(n=>n.type==="lever").length}</b> levers</span>}
              {warRoom&&<span><b style={{color:"#FF1744"}}>{activeGraph.nodes.filter(n=>n.type==="constraint").length}</b> constraints</span>}
              <span><b style={{color:"#d0d0da"}}>{activeGraph.links.length}</b> edges</span>
            </>}
            {maxYr&&<span style={{color:"#E8A838",fontWeight:600}}>{"\u2264"} {maxYr}</span>}
          </div>
          <svg ref={svgRef} width={dims.w} height={dims.h} style={{display:"block",position:"absolute",top:0,left:0,width:"100%",height:"100%"}}/>
          {viewMode==="ring"&&!activeTour&&<button onClick={()=>{setViewMode("graph");setExpandedConcept(null);}} style={{position:"absolute",bottom:14,right:14,zIndex:10,padding:"8px 16px",borderRadius:8,background:"rgba(232,168,56,0.1)",border:"1px solid rgba(232,168,56,0.2)",color:"#E8A838",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(4px)"}}>Explore Full Graph</button>}
          {viewMode==="graph"&&expandedConcept&&!tourId&&!warRoom&&<div style={{position:"absolute",bottom:14,right:14,zIndex:10,display:"flex",gap:8}}>
            <button onClick={()=>{setExpandedConcept(null);}} style={{padding:"8px 16px",borderRadius:8,background:"rgba(155,126,212,0.12)",border:"1px solid rgba(155,126,212,0.25)",color:"#9b7ed4",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(4px)"}}>Show Full Graph</button>
            <button onClick={()=>{setViewMode("ring");setExpandedConcept(null);setSel(null);}} style={{padding:"8px 16px",borderRadius:8,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#9a9aaa",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(4px)"}}>Back to Overview</button>
          </div>}
          {viewMode==="graph"&&!expandedConcept&&!tourId&&!warRoom&&<button onClick={()=>{setViewMode("ring");setExpandedConcept(null);setSel(null);}} style={{position:"absolute",bottom:14,right:14,zIndex:10,padding:"8px 16px",borderRadius:8,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#9a9aaa",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(4px)"}}>Back to Overview</button>}
          {activeTour&&<div style={{position:"absolute",bottom:14,left:14,right:14,zIndex:10,background:"rgba(11,12,16,0.94)",backdropFilter:"blur(8px)",border:"1px solid "+activeTour.color+"44",borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><span style={{fontSize:10,fontWeight:700,color:activeTour.color,textTransform:"uppercase",letterSpacing:"1px"}}>{activeTour.title}</span><span style={{fontSize:10,color:"#5a5a6a",marginLeft:10}}>Step {tourStep+1}/{activeTour.stops.length}</span></div><button onClick={()=>{setTourId(null);setTourStep(0);setViewMode("ring");}} style={{background:"none",border:"none",color:"#5a5a6a",cursor:"pointer",fontSize:18,fontFamily:"inherit",padding:"0 4px"}}>{"\u00D7"}</button></div>
            <div style={{display:"flex",gap:3,marginBottom:10}}>{activeTour.stops.map((_,i)=><div key={i} onClick={()=>setTourStep(i)} style={{flex:1,height:3,borderRadius:2,background:i<=tourStep?activeTour.color:"rgba(255,255,255,0.08)",cursor:"pointer"}}/>)}</div>
            <div style={{fontSize:13,fontWeight:600,color:"#f0e6d8",marginBottom:4}}>{tourStopLabel}</div>
            <div style={{fontSize:11,color:"#9a9aaa",lineHeight:1.6,marginBottom:10}}>{activeTour.stops[tourStep].narr}</div>
            <div style={{display:"flex",gap:8}}>
              <button disabled={tourStep===0} onClick={()=>setTourStep(s=>s-1)} style={{padding:"5px 14px",borderRadius:5,background:tourStep===0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:tourStep===0?"#3a3a4a":"#a0a0b0",fontSize:10,cursor:tourStep===0?"default":"pointer",fontFamily:"inherit"}}>{"\u2190 Previous"}</button>
              <button disabled={tourStep>=activeTour.stops.length-1} onClick={()=>setTourStep(s=>s+1)} style={{padding:"5px 14px",borderRadius:5,background:tourStep>=activeTour.stops.length-1?"rgba(255,255,255,0.02)":activeTour.color+"22",border:"1px solid "+(tourStep>=activeTour.stops.length-1?"rgba(255,255,255,0.08)":activeTour.color+"44"),color:tourStep>=activeTour.stops.length-1?"#3a3a4a":activeTour.color,fontSize:10,cursor:tourStep>=activeTour.stops.length-1?"default":"pointer",fontFamily:"inherit"}}>{"Next \u2192"}</button>
            </div>
          </div>}
        </div>
        {(!isMobile||!rightPanel)&&<button onClick={()=>setRightPanel(p=>!p)} style={{position:"absolute",right:isMobile?0:(rightPanel?260:0),top:"50%",transform:"translateY(-50%)",zIndex:20,width:20,height:48,borderRadius:rightPanel?"6px 0 0 6px":"0 6px 6px 0",background:"rgba(30,31,40,0.9)",border:"1px solid rgba(255,255,255,0.08)",borderRight:rightPanel?"none":"1px solid rgba(255,255,255,0.08)",borderLeft:rightPanel?"1px solid rgba(255,255,255,0.08)":"none",color:"#6a6a7a",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"right 0.2s ease"}}>{rightPanel?"\u203A":"\u2039"}</button>}
        {rightPanel&&<div style={{width:isMobile?"100%":260,minWidth:isMobile?0:260,padding:"14px 12px",borderLeft:isMobile?"none":"1px solid rgba(255,255,255,0.04)",overflowY:"auto",flexShrink:0,...(isMobile?{position:"absolute",right:0,top:0,bottom:0,zIndex:15,background:"#0b0c10"}:{})}}>{isMobile&&<button onClick={()=>setRightPanel(false)} style={{position:"absolute",top:8,right:8,zIndex:1,width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#6a6a7a",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{"\u2715"}</button>}
          {det?<div>
            <div style={{display:"inline-block",padding:"2px 8px",borderRadius:8,background:det.color+"22",border:"1px solid "+det.color+"44",color:det.color,fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>{det.type==="concept"?"Concept":det.type==="lever"?"Policy Lever":det.type==="constraint"?"Constraint":(TIERS[det.tier]?TIERS[det.tier].label:"Paper")}{" \u2022 "}{DOM[det.domain]?DOM[det.domain].label:""}{det.yr?" \u2022 "+det.yr:""}</div>
            <div style={{fontSize:det.type==="concept"?17:14,fontWeight:700,color:"#f0e6d8",lineHeight:1.3,marginBottom:6}}>{det.type==="concept"?det.label.replace("\n"," "):det.label}</div>
            {det.type==="concept"&&det.desc&&<div style={{fontSize:11,color:"#8b8b9b",lineHeight:1.5,marginBottom:12}}>{det.desc}</div>}
            {(det.type==="lever"||det.type==="constraint")&&det.desc&&<div style={{fontSize:11,color:det.type==="lever"?"#80DEEA":"#EF9A9A",lineHeight:1.5,marginBottom:12}}>{det.desc}</div>}
            {det.type==="paper"&&det.full&&<div style={{fontSize:10,color:"#7a7a8a",lineHeight:1.5,marginBottom:10}}>{det.full}</div>}
            {det.student&&<div style={{marginBottom:12}}>
              <div style={{display:"inline-block",padding:"2px 8px",borderRadius:8,background:"rgba(171,71,188,0.15)",border:"1px solid rgba(171,71,188,0.3)",color:"#CE93D8",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Contribution {"\u2022"} {det.addedBy||"Anonymous"}</div>
              {det.justification&&<div style={{padding:8,borderRadius:6,background:"rgba(171,71,188,0.04)",border:"1px solid rgba(171,71,188,0.1)",marginBottom:8}}><div style={{fontSize:8,fontWeight:700,color:"#8a6a9a",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Justification</div><div style={{fontSize:10,color:"#a0a0b0",lineHeight:1.5}}>{det.justification}</div></div>}
              {det.aiReview&&<div style={{padding:8,borderRadius:6,background:"rgba(171,71,188,0.04)",border:"1px solid rgba(171,71,188,0.1)",marginBottom:8}}><div style={{fontSize:8,fontWeight:700,color:"#8a6a9a",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>AI Review</div><div style={{fontSize:10,color:"#a0a0b0",lineHeight:1.5}}>{det.aiReview.overallFeedback}</div><div style={{marginTop:4,fontSize:9,fontWeight:600,color:det.aiReview.justificationScore==="strong"?"#66BB6A":det.aiReview.justificationScore==="adequate"?"#E8A838":"#FF5252"}}>Score: {det.aiReview.justificationScore}</div></div>}
              <div style={{fontSize:8,fontWeight:700,color:"#5a5a6a",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4,marginTop:4}}>Promote as</div>
              <div style={{display:"flex",gap:3,marginBottom:4}}>
                <button onClick={()=>requestAdmin("promote_spine",det.id)} style={{flex:1,padding:"5px 4px",borderRadius:5,background:"rgba(232,168,56,0.08)",border:"1px solid rgba(232,168,56,0.2)",color:"#E8A838",fontSize:8,cursor:"pointer",fontFamily:"inherit",lineHeight:1.3}}>{"\uD83D\uDD12"} Spine</button>
                <button onClick={()=>requestAdmin("promote_frontier",det.id)} style={{flex:1,padding:"5px 4px",borderRadius:5,background:"rgba(155,126,212,0.08)",border:"1px solid rgba(155,126,212,0.2)",color:"#9b7ed4",fontSize:8,cursor:"pointer",fontFamily:"inherit",lineHeight:1.3}}>{"\uD83D\uDD12"} Frontier</button>
                <button onClick={()=>requestAdmin("promote_supporting",det.id)} style={{flex:1,padding:"5px 4px",borderRadius:5,background:"rgba(76,175,80,0.08)",border:"1px solid rgba(76,175,80,0.15)",color:"#66BB6A",fontSize:8,cursor:"pointer",fontFamily:"inherit",lineHeight:1.3}}>{"\uD83D\uDD12"} Supporting</button>
              </div>
              <button onClick={()=>requestAdmin("remove",det.id)} style={{width:"100%",padding:"4px 8px",borderRadius:5,background:"rgba(212,91,91,0.05)",border:"1px solid rgba(212,91,91,0.1)",color:"#d45b5b88",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{"\uD83D\uDD12"} Remove</button>
            </div>}
            {det.promoted&&<div style={{marginBottom:12}}>
              <div style={{display:"inline-block",padding:"2px 8px",borderRadius:8,background:"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.3)",color:"#66BB6A",fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>{"\u2713"} Promoted {"\u2022"} {TIERS[det.tier]?TIERS[det.tier].label:det.tier}</div>
              <button onClick={()=>requestAdmin("demote",det.id)} style={{width:"100%",padding:"4px 8px",borderRadius:5,background:"rgba(232,168,56,0.05)",border:"1px solid rgba(232,168,56,0.1)",color:"#E8A83888",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>{"\uD83D\uDD12"} Demote back to pending</button>
            </div>}
            {det.cases&&det.cases.length>0&&<><Lbl>Cases</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:10}}>{det.cases.map(c=><Tag key={c} label={c} active={fCase===c} ac="rgba(91,212,163,0.25)" onClick={()=>setFCase(p=>p===c?null:c)}/>)}</div></>}
            {detEdges.length>0&&<><Lbl>Relationships ({detEdges.length})</Lbl><div style={{maxHeight:320,overflowY:"auto"}}>{detEdges.map((e,i)=><div key={i} style={{padding:"5px 7px",marginBottom:2,borderRadius:4,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.03)",cursor:"pointer"}} onClick={()=>{const oid=e.s===det.id?e.t:e.s,n=fullGraph.nodes.find(nn=>nn.id===oid);if(n)setSel(n);}}>
              <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}><svg width={12} height={6}><line x1={0} y1={3} x2={12} y2={3} stroke={ET[e.type]?ET[e.type].color:"#888"} strokeWidth={2} strokeDasharray={ET[e.type]?(ET[e.type].dash||"none"):"none"}/></svg><span style={{fontSize:8,color:ET[e.type]?ET[e.type].color:"#888",fontWeight:600,textTransform:"uppercase"}}>{ET[e.type]?ET[e.type].label:e.type}</span><span style={{fontSize:8,color:"#444"}}>{e.dir==="out"?"\u2192":"\u2190"}</span></div>
              <div style={{fontSize:10,color:"#c0c0ca",fontWeight:500}}>{e.otherLabel}</div>
              <div style={{fontSize:9,color:"#5a5a6a",marginTop:1,lineHeight:1.4}}>{e.note}</div>
            </div>)}</div></>}
          </div>:sprintData?<div>
            <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(0,229,255,0.04)",border:"1px solid rgba(0,229,255,0.15)",marginBottom:12}}>
              <div style={{fontSize:8,fontWeight:700,color:"#00E5FF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Country Sprint</div>
              <div style={{fontSize:18,fontWeight:700,color:"#f0e6d8"}}>{sprintCase}</div>
              <div style={{fontSize:9,color:"#5a5a6a",marginTop:4}}>Diagnostic dashboard: constraints, levers, and mechanism chains.</div>
            </div>
            {sprintData.constraints.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:9,fontWeight:700,color:"#FF1744",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><svg width={10} height={10}><polygon points="5,0 10,5 5,10 0,5" fill="#FF174444" stroke="#FF1744" strokeWidth={1}/></svg>Binding Constraints ({sprintData.constraints.length})</div>
              {sprintData.constraints.map(c=>{const blocked=sprintData.mechanisms.filter(m=>m.blocked&&warEdges.some(e=>e.s===c.id&&e.t===m.id&&e.type==="blocks"));const relaxedBy=warEdges.filter(e=>e.t===c.id&&e.type==="relaxes"&&(countryLevers[sprintCase]||[]).includes(e.s)).map(e=>{const lv=levers.find(l=>l.id===e.s);return{label:lv?lv.label.replace("\n"," "):e.s,note:e.note};});return <div key={c.id} style={{padding:"8px 10px",marginBottom:4,borderRadius:6,background:"rgba(255,23,68,0.04)",border:"1px solid rgba(255,23,68,0.12)",cursor:"pointer"}} onClick={()=>{const n=fullGraph.nodes.find(nn=>nn.id===c.id);if(n)setSel(n);}}>
                <div style={{fontSize:11,fontWeight:600,color:"#FFCDD2"}}>{c.label.replace("\n"," ")}</div>
                <div style={{fontSize:9,color:"#7a6a6a",lineHeight:1.5,marginTop:2}}>{c.desc}</div>
                {blocked.length>0&&<div style={{marginTop:4}}>{blocked.map(m=><div key={m.id} style={{fontSize:8,color:"#FF5252",display:"flex",alignItems:"center",gap:3}}><span style={{opacity:0.6}}>{"\u26D4"}</span> Blocks {m.label.replace("\n"," ")}</div>)}</div>}
                {relaxedBy.length>0&&<div style={{marginTop:3,paddingTop:3,borderTop:"1px solid rgba(255,255,255,0.04)"}}>{relaxedBy.map((r,i)=><div key={i} style={{fontSize:8,color:"#76FF03",display:"flex",alignItems:"center",gap:3}}><span style={{opacity:0.7}}>{"\u2714"}</span> {r.label}: {r.note}</div>)}</div>}
              </div>;})}
            </div>}
            {sprintData.levers.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:9,fontWeight:700,color:"#00E5FF",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><svg width={12} height={10}><polygon points="3,0 9,0 12,5 9,10 3,10 0,5" fill="#00E5FF22" stroke="#00E5FF" strokeWidth={1}/></svg>Levers Attempted ({sprintData.levers.length})</div>
              {sprintData.levers.map(l=>{const activates=warEdges.filter(e=>e.s===l.id&&e.type==="activates").map(e=>{const cn=concepts.find(c=>c.id===e.t);return{label:cn?cn.label.replace("\n"," "):e.t,note:e.note};});const relaxes=warEdges.filter(e=>e.s===l.id&&e.type==="relaxes"&&(countryConstraints[sprintCase]||[]).some(cid=>cid===e.t)).map(e=>{const cn=wrConstraints.find(c=>c.id===e.t);return{label:cn?cn.label.replace("\n"," "):e.t,note:e.note};});return <div key={l.id} style={{padding:"8px 10px",marginBottom:4,borderRadius:6,background:"rgba(0,229,255,0.04)",border:"1px solid rgba(0,229,255,0.12)",cursor:"pointer"}} onClick={()=>{const n=fullGraph.nodes.find(nn=>nn.id===l.id);if(n)setSel(n);}}>
                <div style={{fontSize:11,fontWeight:600,color:"#B2EBF2"}}>{l.label.replace("\n"," ")}</div>
                <div style={{fontSize:9,color:"#6a7a7a",lineHeight:1.5,marginTop:2}}>{l.desc}</div>
                {activates.length>0&&<div style={{marginTop:4}}>{activates.map((a,i)=><div key={i} style={{fontSize:8,color:"#00E5FF",display:"flex",alignItems:"center",gap:3}}><span>{"\u2192"}</span> Activates {a.label}</div>)}</div>}
                {relaxes.length>0&&<div style={{marginTop:3,paddingTop:3,borderTop:"1px solid rgba(255,255,255,0.04)"}}>{relaxes.map((r,i)=><div key={i} style={{fontSize:8,color:"#76FF03",display:"flex",alignItems:"center",gap:3}}><span>{"\u21DD"}</span> Relaxes {r.label}</div>)}</div>}
              </div>;})}
            </div>}
            {sprintData.mechanisms.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:9,fontWeight:700,color:"#E8A838",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Mechanism Chains ({sprintData.mechanisms.length})</div>
              {sprintData.mechanisms.map(m=><div key={m.id} style={{padding:"6px 10px",marginBottom:3,borderRadius:5,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.1)",cursor:"pointer"}} onClick={()=>{const n=fullGraph.nodes.find(nn=>nn.id===m.id);if(n)setSel(n);}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {m.activated&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:"rgba(0,229,255,0.15)",color:"#00E5FF",fontWeight:600}}>ACTIVATED</span>}
                  {m.blocked&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:"rgba(255,23,68,0.15)",color:"#FF1744",fontWeight:600}}>BLOCKED</span>}
                  <span style={{fontSize:10,color:"#f0e6d8",fontWeight:500}}>{m.label.replace("\n"," ")}</span>
                </div>
              </div>)}
            </div>}
            {sprintData.papers.length>0&&<div>
              <div style={{fontSize:9,fontWeight:700,color:"#9a9aaa",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Key Papers ({sprintData.papers.length})</div>
              {sprintData.papers.map(p=><div key={p.id} style={{padding:"5px 8px",marginBottom:2,borderRadius:4,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.03)",cursor:"pointer",fontSize:10,color:"#a0a0b0"}} onClick={()=>{const n=fullGraph.nodes.find(nn=>nn.id===p.id);if(n)setSel(n);}}>{p.short||p.label}</div>)}
            </div>}
          </div>:<div style={{textAlign:"center",paddingTop:40}}>
            <div style={{fontSize:32,marginBottom:8,opacity:0.2}}>{"\uD83C\uDF10"}</div>
            {viewMode==="ring"?<>
              <div style={{fontSize:12,color:"#5a5a6a",lineHeight:1.6,marginBottom:10}}>Click a concept to explore its neighborhood.</div>
              <div style={{fontSize:10,color:"#3a3a4a",lineHeight:1.6}}>The ring shows <b style={{color:"#555"}}>{concepts.length} key concepts</b> grouped by domain. Click any concept to dive into the full graph focused on its neighborhood.<br/><br/>Try <b style={{color:"#E8A838"}}>Guided Tours</b> for narrated paths, or <b style={{color:"#E8A838"}}>Explore Full Graph</b> to see all {papers.length} papers at once.</div>
            </>:<>
              <div style={{fontSize:12,color:"#5a5a6a",lineHeight:1.6,marginBottom:10}}>Hover or click any node.</div>
              <div style={{fontSize:10,color:"#3a3a4a",lineHeight:1.6}}><b style={{color:"#555"}}>Glowing</b> = concepts<br/><b style={{color:"#555"}}>Large filled</b> = canonical spine<br/><b style={{color:"#555"}}>Arrows</b> = typed edges<br/>Try <b style={{color:"#E8A838"}}>Guided Tours</b> or the <b style={{color:"#E8A838"}}>Timeline slider</b>.{!warRoom&&<span><br/><br/>Toggle <b style={{color:"#00E5FF"}}>War Room</b> for policy levers, constraints, and country diagnostics.</span>}{warRoom&&!sprintCase&&<span><br/><br/>Select a <b style={{color:"#00E5FF"}}>Country Sprint</b> in the left panel to see diagnostic chains.</span>}</div>
            </>}
            <div style={{marginTop:16,padding:10,borderRadius:6,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",textAlign:"left"}}>
              <div style={{fontSize:8,color:"#555",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Edge Types</div>
              {Object.entries(ET).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,fontSize:9,color:"#5a5a6a"}}><svg width={16} height={6}><line x1={0} y1={3} x2={16} y2={3} stroke={v.color} strokeWidth={2} strokeDasharray={v.dash||"none"}/></svg>{v.label}</div>)}
            </div>
          </div>}
        </div>}
      </div>
      {proposalOpen&&<ProposalModal onClose={()=>setProposalOpen(false)} existingIds={new Set([...papers.map(p=>p.id),...studentPapers.map(p=>p.id),...promotedPapers.map(p=>p.id)])} onAdd={(paper)=>{saveStudentPapers([...studentPapers,paper]);setProposalOpen(false);setShowStudentPapers(true);}}/>}
      {adminPrompt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAdminPrompt(null)}>
        <div style={{background:"#1a1b22",border:"1px solid rgba(212,91,91,0.3)",borderRadius:10,padding:20,width:320}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:13,fontWeight:700,color:"#f0e6d8",marginBottom:12}}>{"\uD83D\uDD12"} Admin Authentication</div>
          <div style={{fontSize:10,color:"#6a6a7a",marginBottom:12}}>
            {adminPrompt.action==="clearAll"?"Clear all pending submissions?":
             adminPrompt.action==="clearPromoted"?"Clear all promoted papers?":
             adminPrompt.action==="remove"?"Remove this submission?":
             adminPrompt.action==="promote_spine"?"Promote as Canonical Spine?":
             adminPrompt.action==="promote_frontier"?"Promote as Research Frontier?":
             adminPrompt.action==="promote_supporting"?"Promote as Supporting?":
             adminPrompt.action==="demote"?"Move this paper back to pending?":"Admin action"}
          </div>
          <input type="password" value={adminPw} onChange={e=>{setAdminPw(e.target.value);setAdminErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(adminPw===ADMIN_PW){setAdminAuth(true);execAdminAction(adminPrompt.action,adminPrompt.paperId);}else{setAdminErr(true);}}}} placeholder="Enter admin password" autoFocus style={{width:"100%",padding:"8px 12px",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid "+(adminErr?"rgba(255,23,68,0.5)":"rgba(255,255,255,0.1)"),color:"#d0d0da",fontSize:11,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          {adminErr&&<div style={{fontSize:9,color:"#FF5252",marginTop:4}}>Incorrect password</div>}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>setAdminPrompt(null)} style={{flex:1,padding:"6px 12px",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"none",color:"#6a6a7a",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <button onClick={()=>{if(adminPw===ADMIN_PW){setAdminAuth(true);execAdminAction(adminPrompt.action,adminPrompt.paperId);}else{setAdminErr(true);}}} style={{flex:1,padding:"6px 12px",borderRadius:6,background:adminPrompt.action.startsWith("promote")?"rgba(76,175,80,0.15)":"rgba(212,91,91,0.15)",border:"none",color:adminPrompt.action.startsWith("promote")?"#66BB6A":"#d45b5b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Confirm</button>
          </div>
        </div>
      </div>}
      {showAbout&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowAbout(false)}>
        <div style={{background:"#14151c",border:"1px solid rgba(232,168,56,0.2)",borderRadius:14,width:520,maxHeight:"80vh",overflow:"auto",padding:"32px 36px"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:26,fontWeight:800,color:"#f0e6d8",marginBottom:4,letterSpacing:"-0.5px"}}>Growth Miracles</div>
          <div style={{fontSize:12,color:"#E8A838",fontWeight:600,marginBottom:20}}>Interactive Knowledge Graph</div>
          <div style={{fontSize:12,color:"#a0a0b0",lineHeight:1.7,marginBottom:20}}>
            This is an interactive knowledge bank mapping the intellectual landscape of growth miracles in development economics: how countries escape poverty, the theories that explain it, the evidence behind them, and the policy levers that made it happen.
          </div>
          <div style={{fontSize:12,color:"#a0a0b0",lineHeight:1.7,marginBottom:20}}>
            The graph contains <b style={{color:"#d0d0da"}}>{papers.length} papers</b>, <b style={{color:"#d0d0da"}}>{concepts.length} concepts</b>, and <b style={{color:"#d0d0da"}}>{edges.length} typed relationships</b> spanning seven decades of research, from Solow's growth residual to frontier causal identification.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <div style={{padding:12,borderRadius:8,background:"rgba(232,168,56,0.04)",border:"1px solid rgba(232,168,56,0.1)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#E8A838",marginBottom:6}}>Explore</div>
              <div style={{fontSize:10,color:"#7a7a8a",lineHeight:1.6}}>Filter by domain, tier, country, or edge type. Use the timeline slider to watch the field evolve decade by decade. Search for any paper or concept.</div>
            </div>
            <div style={{padding:12,borderRadius:8,background:"rgba(91,163,212,0.04)",border:"1px solid rgba(91,163,212,0.1)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5BA3D4",marginBottom:6}}>Guided Tours</div>
              <div style={{fontSize:10,color:"#7a7a8a",lineHeight:1.6}}>Nine narrated paths through the literature: from the export discipline story to the demographic window. Each tour highlights nodes step by step with commentary.</div>
            </div>
            <div style={{padding:12,borderRadius:8,background:"rgba(0,229,255,0.04)",border:"1px solid rgba(0,229,255,0.1)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#00E5FF",marginBottom:6}}>War Room</div>
              <div style={{fontSize:10,color:"#7a7a8a",lineHeight:1.6}}>Toggle on policy levers and constraints. Run a Country Sprint to see the diagnostic chain: what's binding, what levers exist, and which mechanisms they activate.</div>
            </div>
            <div style={{padding:12,borderRadius:8,background:"rgba(171,71,188,0.04)",border:"1px solid rgba(171,71,188,0.1)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#CE93D8",marginBottom:6}}>Contribute</div>
              <div style={{fontSize:10,color:"#7a7a8a",lineHeight:1.6}}>Propose a paper: write a justification, draw edges to existing nodes, and receive AI feedback on your placement. Contributions appear as pending until promoted.</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><span style={{width:12,height:12,borderRadius:"50%",background:"#E8A838",opacity:0.3,border:"1.5px solid #E8A838"}}/> Concept</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><span style={{width:10,height:10,borderRadius:"50%",background:"#E8A838cc"}}/> Spine</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><span style={{width:8,height:8,borderRadius:"50%",background:"#9b7ed488"}}/> Frontier</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><span style={{width:6,height:6,borderRadius:"50%",background:"#16161e",border:"1px solid #888"}}/> Supporting</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><svg width={12} height={10}><polygon points="3,0 9,0 12,5 9,10 3,10 0,5" fill="#00E5FF22" stroke="#00E5FF" strokeWidth={1}/></svg> Lever</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6a7a"}}><svg width={10} height={10}><polygon points="5,0 10,5 5,10 0,5" fill="#FF174422" stroke="#FF1744" strokeWidth={1}/></svg> Constraint</div>
          </div>
          <div style={{fontSize:10,color:"#4a4a5a",lineHeight:1.6,marginBottom:20}}>Click, hover, drag, and zoom to explore. Press <b style={{color:"#6a6a7a"}}>Esc</b> or click outside to dismiss this panel.</div>
          <button onClick={()=>setShowAbout(false)} style={{width:"100%",padding:"10px 16px",borderRadius:8,background:"rgba(232,168,56,0.12)",border:"1px solid rgba(232,168,56,0.25)",color:"#E8A838",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Enter the Knowledge Graph</button>
        </div>
      </div>}
    </div>
  );
}
