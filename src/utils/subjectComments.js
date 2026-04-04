// Detailed CBC-aligned remarks per subject per band
// Used for the Remarks column in the report card table

const SUBJECT_REMARKS = {
  mathematics: {
    EE1: 'Demonstrates exceptional mathematical reasoning and problem-solving skills beyond grade level.',
    EE2: 'Shows excellent command of mathematical concepts and applies them accurately.',
    ME1: 'Has a good grasp of mathematical concepts; continue practising complex problems.',
    ME2: 'Meets the expected standard; focus on speed and accuracy in calculations.',
    AE1: 'Approaching expectations; more practice on number operations and problem-solving is needed.',
    AE2: 'Needs to strengthen foundational mathematical skills through regular practice.',
    BE1: 'Struggling with core mathematical concepts; targeted revision and support required.',
    BE2: 'Very limited understanding; urgent remedial intervention strongly recommended.',
  },
  english: {
    EE1: 'Demonstrates outstanding proficiency in English — reading, writing, and oral communication are exemplary.',
    EE2: 'Excellent command of English language skills; expresses ideas clearly and confidently.',
    ME1: 'Good English skills demonstrated; work on expanding vocabulary and essay structure.',
    ME2: 'Meets the basic standard in English; consistent reading practice will improve performance.',
    AE1: 'Approaching expectations; needs to work on comprehension and written expression.',
    AE2: 'Shows limited English proficiency; extra reading and writing exercises are recommended.',
    BE1: 'Significant gaps in English language skills; intensive support is required.',
    BE2: 'Very low performance in English; immediate remedial support is essential.',
  },
  kiswahili: {
    EE1: 'Anaonyesha ujuzi wa hali ya juu katika Kiswahili — mazungumzo, uandishi, na usomaji ni bora sana.',
    EE2: 'Ufahamu mzuri sana wa Kiswahili; endelea kujifunza na kuboresha zaidi.',
    ME1: 'Anakidhi matarajio katika Kiswahili; jitahidi kuboresha muundo wa sentensi na msamiati.',
    ME2: 'Anakidhi kiwango cha chini; jifunze maneno mapya na soma vitabu zaidi.',
    AE1: 'Anakaribia matarajio; anahitaji mazoezi zaidi ya uandishi na mazungumzo ya Kiswahili.',
    AE2: 'Ufahamu mdogo wa Kiswahili; msaada wa ziada na mazoezi ya kila siku unahitajika.',
    BE1: 'Matokeo ya chini sana; msaada wa haraka na maalum unahitajika katika Kiswahili.',
    BE2: 'Kiwango cha chini kabisa; hatua za haraka za kurekebisha zinahitajika.',
  },
  integrated_science: {
    EE1: 'Exceptional scientific inquiry skills; analyses and interprets data with outstanding precision.',
    EE2: 'Excellent understanding of scientific concepts and their real-world applications.',
    ME1: 'Good scientific understanding; work on applying concepts to practical investigations.',
    ME2: 'Meets expectations; strengthen understanding of key scientific processes and terminology.',
    AE1: 'Approaching expectations; needs more engagement with science investigations and concepts.',
    AE2: 'Limited understanding of core science concepts; regular review and practice is necessary.',
    BE1: 'Very low performance; requires significant support in understanding scientific principles.',
    BE2: 'Critical gaps in science knowledge; immediate remedial attention is required.',
  },
  agriculture: {
    EE1: 'Outstanding knowledge of agricultural practices; applies concepts to real farming situations excellently.',
    EE2: 'Excellent understanding of agricultural concepts and their practical applications.',
    ME1: 'Good performance in Agriculture; continue engaging with practical farming activities.',
    ME2: 'Meets the standard; work on understanding agricultural inputs and their management.',
    AE1: 'Approaching expectations; more hands-on practice and revision of agricultural concepts needed.',
    AE2: 'Limited understanding of Agriculture; consistent study and practical engagement required.',
    BE1: 'Very low grasp of agricultural concepts; targeted support and revision is necessary.',
    BE2: 'Critical performance; urgent remedial action in Agriculture is strongly recommended.',
  },
  social_studies: {
    EE1: 'Exceptional understanding of social, civic, and environmental issues; demonstrates outstanding critical thinking.',
    EE2: 'Excellent knowledge of Social Studies concepts and their application to everyday life.',
    ME1: 'Good performance; continue engaging with current social and civic affairs.',
    ME2: 'Meets the expected standard; work on improving essay responses and map reading.',
    AE1: 'Approaching expectations; needs to engage more with social studies content and revision.',
    AE2: 'Limited understanding; regular revision and wider reading on social issues is recommended.',
    BE1: 'Very low performance; significant support in Social Studies content is required.',
    BE2: 'Critical gaps in knowledge; immediate remedial attention in Social Studies is needed.',
  },
  pretechnical_studies: {
    EE1: 'Exceptional technical skills and creativity; demonstrates mastery in design and construction tasks.',
    EE2: 'Excellent performance in Pre-Technical Studies; applies technical skills with great precision.',
    ME1: 'Good technical understanding; work on improving accuracy and finishing of practical tasks.',
    ME2: 'Meets expectations; continue practising technical drawing and workshop skills.',
    AE1: 'Approaching expectations; more practice in technical skills and theory is recommended.',
    AE2: 'Limited technical skills; additional support and guided practice is necessary.',
    BE1: 'Very low performance; intensive hands-on support in Pre-Technical Studies is required.',
    BE2: 'Critical performance; immediate remedial intervention in technical skills is urgently needed.',
  },
  religious_studies: {
    EE1: 'Demonstrates outstanding moral reasoning and deep understanding of religious teachings and their application.',
    EE2: 'Excellent grasp of religious concepts; applies values of integrity and compassion consistently.',
    ME1: 'Good performance in Religious Studies; continue exploring moral and ethical principles.',
    ME2: 'Meets the standard; work on relating religious teachings to contemporary life situations.',
    AE1: 'Approaching expectations; needs deeper engagement with religious texts and moral reasoning.',
    AE2: 'Limited understanding of religious concepts; regular revision and reflection is needed.',
    BE1: 'Very low performance; support in understanding core religious principles is required.',
    BE2: 'Critical performance; immediate remedial support in Religious Studies is recommended.',
  },
  creative_art: {
    EE1: 'Outstanding creativity and artistic expression; produces work of exceptional quality and originality.',
    EE2: 'Excellent artistic skills; demonstrates creativity and attention to detail in all projects.',
    ME1: 'Good performance in Creative Art; continue exploring different art techniques and styles.',
    ME2: 'Meets expectations; work on improving precision and creativity in artistic tasks.',
    AE1: 'Approaching expectations; needs to spend more time on art projects and techniques.',
    AE2: 'Limited artistic expression; more practice and experimentation with art media is recommended.',
    BE1: 'Very low performance in Creative Art; additional guidance and practice is required.',
    BE2: 'Critical performance; intensive support and encouragement in art activities is needed.',
  },
};

/**
 * Returns a short subject-specific remark based on subject and band.
 */
export function getSubjectComment(subjectKey, band) {
  if (!band) return '—';
  const subjectMap = SUBJECT_REMARKS[subjectKey];
  if (!subjectMap) return '—';
  return subjectMap[band] || '—';
}