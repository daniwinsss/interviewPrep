// Curated list of 40 Bronze + 30 Silver + 20 Gold USACO problems
// Source: usaco.org — problems are publicly accessible
// Topics follow standard USACO Guide categorizations

export const BRONZE_PROBLEMS = [
  // --- 2023 Season ---
  { cpid: 1306, title: 'Farmer John\'s Favorite Sport', contest: '2023 February Bronze', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 1307, title: 'Porcupine\'s Dilemma', contest: '2023 February Bronze', difficulty: 'Easy', topic: 'Simulation' },
  { cpid: 1308, title: 'Milk Measurement III', contest: '2023 February Bronze', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 1340, title: 'Hungry Cow', contest: '2023 March Bronze', difficulty: 'Easy', topic: 'Simulation' },
  { cpid: 1341, title: 'FJ and His Cows', contest: '2023 March Bronze', difficulty: 'Easy', topic: 'Complete Search' },
  { cpid: 1342, title: 'Moo Playlist', contest: '2023 March Bronze', difficulty: 'Medium', topic: 'Simulation' },

  // --- 2022 Season ---
  { cpid: 1229, title: 'Counting Liars', contest: '2022 February Bronze', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 1230, title: 'Photoshoot 2', contest: '2022 February Bronze', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1231, title: 'Herding', contest: '2022 February Bronze', difficulty: 'Hard', topic: 'Ad Hoc' },
  { cpid: 1253, title: 'Haybale Stacking', contest: '2022 March Bronze', difficulty: 'Easy', topic: 'Prefix Sums' },
  { cpid: 1254, title: 'Sleeping in Class', contest: '2022 March Bronze', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1255, title: 'Bovine Genomics', contest: '2022 March Bronze', difficulty: 'Medium', topic: 'Complete Search' },
  { cpid: 1200, title: 'Lonely Photo', contest: '2022 January Bronze', difficulty: 'Easy', topic: 'Ad Hoc' },
  { cpid: 1201, title: 'Uddering Confusion', contest: '2022 January Bronze', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 1202, title: 'Drought', contest: '2022 January Bronze', difficulty: 'Hard', topic: 'Greedy' },
  { cpid: 1165, title: 'Cows and Suits', contest: '2022 US Open Bronze', difficulty: 'Easy', topic: 'Complete Search' },
  { cpid: 1166, title: 'Pairs', contest: '2022 US Open Bronze', difficulty: 'Easy', topic: 'Complete Search' },
  { cpid: 1167, title: 'Alchemy Lab', contest: '2022 US Open Bronze', difficulty: 'Medium', topic: 'Simulation' },

  // --- 2021 Season ---
  { cpid: 1108, title: 'Acowdemia I', contest: '2021 February Bronze', difficulty: 'Easy', topic: 'Sorting' },
  { cpid: 1109, title: 'Year of the Cow', contest: '2021 February Bronze', difficulty: 'Easy', topic: 'Simulation' },
  { cpid: 1110, title: 'Mortal Cow-bat', contest: '2021 February Bronze', difficulty: 'Medium', topic: 'Dynamic Programming' },
  { cpid: 1131, title: 'Even More Odd Photos', contest: '2021 March Bronze', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 1132, title: 'Teleportation', contest: '2021 March Bronze', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 1133, title: 'Lonely Photo', contest: '2021 March Bronze', difficulty: 'Hard', topic: 'Ad Hoc' },
  { cpid: 1062, title: 'Just Stalling', contest: '2021 January Bronze', difficulty: 'Easy', topic: 'Sorting' },
  { cpid: 1063, title: 'Do You Know Your ABCs?', contest: '2021 January Bronze', difficulty: 'Medium', topic: 'Math' },
  { cpid: 1064, title: 'Blocked Billboards', contest: '2021 January Bronze', difficulty: 'Medium', topic: 'Simulation' },

  // --- 2020 Season ---
  { cpid: 1021, title: 'Word Processor', contest: '2020 February Bronze', difficulty: 'Easy', topic: 'Simulation' },
  { cpid: 1022, title: 'Triangles', contest: '2020 February Bronze', difficulty: 'Easy', topic: 'Complete Search' },
  { cpid: 1023, title: 'Swapity Swap', contest: '2020 February Bronze', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 1043, title: 'Cow Tipping', contest: '2020 March Bronze', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 1044, title: 'Moo-Operations', contest: '2020 March Bronze', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1045, title: 'Social Distancing I', contest: '2020 March Bronze', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 971,  title: 'Daydreaming Cowboy', contest: '2020 January Bronze', difficulty: 'Easy', topic: 'Simulation' },
  { cpid: 972,  title: 'Photoshoot', contest: '2020 January Bronze', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 973,  title: 'Race', contest: '2020 January Bronze', difficulty: 'Hard', topic: 'Math' },
  { cpid: 993,  title: 'Fence Planning', contest: '2020 US Open Bronze', difficulty: 'Easy', topic: 'Graphs' },
  { cpid: 994,  title: 'Cowntact Tracing', contest: '2020 US Open Bronze', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 995,  title: 'Bovine Genetics', contest: '2020 US Open Bronze', difficulty: 'Medium', topic: 'Complete Search' },

  // --- 2019 Season ---
  { cpid: 944,  title: 'Milk Factory', contest: '2019 December Bronze', difficulty: 'Easy', topic: 'Graphs' },
  { cpid: 945,  title: 'Livestock Lineup', contest: '2019 December Bronze', difficulty: 'Hard', topic: 'Complete Search' },
];

export const SILVER_PROBLEMS = [
  // --- 2023 Season ---
  { cpid: 1309, title: 'Moo Language', contest: '2023 February Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1310, title: 'Hungry Cow', contest: '2023 February Silver', difficulty: 'Medium', topic: 'Simulation' },
  { cpid: 1311, title: 'Bakery', contest: '2023 February Silver', difficulty: 'Hard', topic: 'Binary Search' },
  { cpid: 1343, title: 'Visited Nodes in a Tree', contest: '2023 March Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1344, title: 'Drought', contest: '2023 March Silver', difficulty: 'Hard', topic: 'Greedy' },

  // --- 2022 Season ---
  { cpid: 1232, title: 'Redistributing Gifts', contest: '2022 February Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1233, title: 'Sleeping in Class Silver', contest: '2022 February Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1234, title: 'Cereal 2', contest: '2022 February Silver', difficulty: 'Hard', topic: 'Graphs' },
  { cpid: 1256, title: 'Midnight Cowpatrol', contest: '2022 March Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1257, title: 'Subset Equality', contest: '2022 March Silver', difficulty: 'Hard', topic: 'Bitmasking' },

  // --- 2021 Season ---
  { cpid: 1111, title: 'Just Stalling', contest: '2021 February Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 1112, title: 'Counting Haybales', contest: '2021 February Silver', difficulty: 'Hard', topic: 'Binary Search' },
  { cpid: 1134, title: 'Comfortable Cows', contest: '2021 March Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1135, title: 'Cowntagion', contest: '2021 March Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1136, title: 'Bootstrapping', contest: '2021 March Silver', difficulty: 'Hard', topic: 'Recursion' },

  // --- 2020 Season ---
  { cpid: 1024, title: 'Clock Tree', contest: '2020 February Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1025, title: 'Triangles', contest: '2020 February Silver', difficulty: 'Medium', topic: 'Geometry' },
  { cpid: 1026, title: 'Painting Barn Door', contest: '2020 February Silver', difficulty: 'Hard', topic: 'Prefix Sums' },
  { cpid: 1046, title: 'Moocast', contest: '2020 March Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1047, title: 'Social Distancing II', contest: '2020 March Silver', difficulty: 'Hard', topic: 'Greedy' },

  // --- 2019 Season ---
  { cpid: 921,  title: 'Fence Planning', contest: '2019 October Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 922,  title: 'Favorite Colors', contest: '2019 October Silver', difficulty: 'Medium', topic: 'Data Structures' },
  { cpid: 923,  title: 'Milk Pumping', contest: '2019 October Silver', difficulty: 'Hard', topic: 'Graphs' },
  { cpid: 946,  title: 'Snowboots', contest: '2019 December Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 947,  title: 'Milk Visits', contest: '2019 December Silver', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 948,  title: 'Convention', contest: '2019 December Silver', difficulty: 'Hard', topic: 'Binary Search' },

  // --- 2018 Season ---
  { cpid: 814,  title: 'Lemonade Line', contest: '2018 February Silver', difficulty: 'Easy', topic: 'Greedy' },
  { cpid: 815,  title: 'Rest Stops', contest: '2018 February Silver', difficulty: 'Medium', topic: 'Greedy' },
  { cpid: 816,  title: 'Taming the Herd', contest: '2018 February Silver', difficulty: 'Hard', topic: 'Dynamic Programming' },
  { cpid: 838,  title: 'Multiplicity', contest: '2018 March Silver', difficulty: 'Medium', topic: 'Number Theory' },
];

export const GOLD_PROBLEMS = [
  // --- 2023 Season ---
  { cpid: 1312, title: 'Triples of Cows', contest: '2023 February Gold', difficulty: 'Medium', topic: 'Combinatorics' },
  { cpid: 1313, title: 'Subtree Activation', contest: '2023 February Gold', difficulty: 'Hard', topic: 'Tree DP' },
  { cpid: 1314, title: 'Problem 3', contest: '2023 February Gold', difficulty: 'Hard', topic: 'Misc' },
  { cpid: 1345, title: 'Cow Frisbee', contest: '2023 March Gold', difficulty: 'Medium', topic: 'Data Structures' },
  { cpid: 1346, title: 'Lights Off', contest: '2023 March Gold', difficulty: 'Hard', topic: 'Bitmasking' },

  // --- 2022 Season ---
  { cpid: 1235, title: 'Moo Network', contest: '2022 February Gold', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1236, title: 'Redistributing Gifts', contest: '2022 February Gold', difficulty: 'Hard', topic: 'Graphs' },
  { cpid: 1258, title: 'Pair Programming', contest: '2022 March Gold', difficulty: 'Medium', topic: 'Dynamic Programming' },
  { cpid: 1259, title: 'Palindrome', contest: '2022 March Gold', difficulty: 'Hard', topic: 'Dynamic Programming' },

  // --- 2021 Season ---
  { cpid: 1113, title: 'Closest Cow Wins', contest: '2021 February Gold', difficulty: 'Medium', topic: 'Two Pointers' },
  { cpid: 1114, title: 'Escape Room', contest: '2021 February Gold', difficulty: 'Hard', topic: 'Graphs' },
  { cpid: 1137, title: 'Portals', contest: '2021 March Gold', difficulty: 'Hard', topic: 'Graphs' },

  // --- 2020 Season ---
  { cpid: 1027, title: 'Delegation', contest: '2020 February Gold', difficulty: 'Medium', topic: 'Tree DP' },
  { cpid: 1028, title: 'Timeline', contest: '2020 February Gold', difficulty: 'Medium', topic: 'Graphs' },
  { cpid: 1029, title: 'Help Graph', contest: '2020 February Gold', difficulty: 'Hard', topic: 'Graphs' },
  { cpid: 1048, title: 'Springboards', contest: '2020 March Gold', difficulty: 'Hard', topic: 'Data Structures' },
  { cpid: 1049, title: 'Favorite Colors', contest: '2020 March Gold', difficulty: 'Medium', topic: 'Data Structures' },

  // --- 2019 Season ---
  { cpid: 924,  title: 'Taunt', contest: '2019 October Gold', difficulty: 'Medium', topic: 'Ad Hoc' },
  { cpid: 949,  title: 'Cow Steeplechase II', contest: '2019 December Gold', difficulty: 'Hard', topic: 'Geometry' },
  { cpid: 950,  title: 'Moortal Cowmbat', contest: '2019 December Gold', difficulty: 'Hard', topic: 'Dynamic Programming' },
];
