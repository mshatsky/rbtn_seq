/*
This module is for storing microbial growth phenotype data, e.g., from
FEBA or ENIGMA
*/

module KBaseRBTnSeq {

typedef int bool;
    
/*
@id ws KBaseGenomes.Genome
*/
typedef string genome_ref;

/*
@id ws KBaseGenomes.Contig
*/
typedef string contig_ref;

/*
@id ws KBaseCommunities.Sample
*/
typedef string sample_ref;

/*
@id ws KBaseBiochem.Media
*/
typedef string media_ref;

/*
	Reference to a Feature object of a genome in the workspace
	@id subws KBaseGenomes.Genome.features.[*].id
*/
typedef string feature_ref;

/*
enum: insertion, deletion, substitution
The latter is not strictly necessary, but convenient to avoid storing
two separate events.
*/
typedef string change_type;

/*
  A Delta is a description of a single change to a strain.  A series
  of Deltas defines the transition from one Strain to another.  For
  sequenced insertions or substitutions, give the 0-indexed position
  on the contig where the insertion/substitution begins, in the +
  direction.  For sequenced deletions and substitutions, give the
  position and length.  The position of all Deltas should be
  calculated relative to the parent strain (derived_from_strain), so
  that the Deltas could be applied in any order.
@optional change feature contig sequence position length
*/
typedef structure {
    string description;
    change_type change;
    feature_ref feature;
    contig_ref contig;
    string sequence;
    int position;
    int length;
} Delta;

/*
@id ws KBaseRBTnSeq.Strain
*/
typedef string strain_ref;

/*
  A Strain is a particular genetic variant of an organism.  Optionally,
  it may be:
    * derived from another Strain (e.g., as an engineered mutant)
    * sequenced
    * isolated from a community
    * a wild-type example of a Genome
  If a strain is "wild type" it should have a non-null genome_ref and a
  null derived_from_strain.  If not wild type, genome_ref should be
  set to the "original" parent strain in KBase, if it exists, or null
  if it does not exist or is unknown.
@optional description genome derived_from_strain deltas isolated_from
*/
typedef structure {
    string name;
    string description;
    genome_ref genome;
    strain_ref derived_from_strain;
    list<Delta> deltas;
    sample_ref isolated_from;
} Strain;

/*
@id ws KBaseRBTnSeq.Pool
*/
typedef string pool_ref;

/*
  A Pool is a collection of barcoded strains.  Barcodes, tags, etc should
  be stored as Deltas in each strain.
@optional comments
*/
typedef structure {
    string name;
    string comments;
    list<Strain> strains;
} Pool;

/*
 Reference to a compound object in a biochemistry
 @id subws KBaseBiochem.Biochemistry.compounds.[*].id
*/
typedef string compound_ref;
    
/*
  A Condition is something that's added to particular aliquots in
  a growth experiment, in addition to the media.  e.g., it may be a stress
  condition, or a nutrient.  Compound is needed if the condition is
  addition of a chemical in the KBase Biochemistry database.
@optional concentration units compound
*/
typedef structure {
    string name;
    float concentration;
    string units;
    compound_ref compound;
} Condition;

/*
@id ws KBaseRBTnSeq.Condition
*/
typedef string condition_ref;

/*
  GrowthParameters describes all the conditions a particular aliquot
  was subjected to in an experiment
@optional description gDNA_plate gDNA_well index media growth_method group temperature pH isLiquid isAerobic shaking growth_plate_id growth_plate_wells startOD endOD total_generations
*/
typedef structure {
    string description;
    string gDNA_plate;
    string gDNA_well;
    string index;
    media_ref media;
    string growth_method;
    string group;
    float temperature;
    float pH;
    bool isLiquid;
    bool isAerobic;
    string shaking;
    string growth_plate_id;
    string growth_plate_wells;
    float startOD;
    float endOD;
    float total_generations;
} GrowthParameters;

/*
@id ws KBaseRBTnSeq.GrowthParameters
*/
typedef string growth_parameters_ref;

/*
  A TnSeqExperiment is an experiment in which a pool of mutants is created 
  by a transposone mutagenesis.
*/
typedef structure {
    string name;
    pool_ref pool;
    string start_date;
    string sequenced_at;
    growth_parameters_ref growth_parameters;
} TnSeqExperiment;

/*
@id ws KBaseRBTnSeq.TnSeqExperiment
*/
typedef string tnseq_experiment_ref;

/*
  Number of strains determined from sequencing of TnSeq library.
  strain_index - index of a strain in Pool.strains list
  count - number of instances of the strain identified from sequencing
*/
typedef tuple<int strain_index,int count> tnseq_result;

/*
  TnSeqExperimentResults stores the results of sequencing of a TnSeq experiment, i.e. 
  number of times each mutant strain is detetcted from sequencing.
*/
typedef structure {
    tnseq_experiment_ref experiment;
    list<tnseq_result> results;
} TnSeqExperimentResults;

/*
@id ws KBaseRBTnSeq.TnSeqExperimentResults
*/
typedef string tnseq_experiment_results_ref;

/*
  TnSeqLibrary is a filtered subset of strains from TnSeqExperimentResults that is 
  suitable for the subsequent analysis of BarSeq experiments.
  list<int tnseq_results_index> selected_lib - index to TnSeqExperimentResults.results
*/
typedef structure {
    tnseq_experiment_results_ref experiment;
    list<int> selected_lib;
} TnSeqLibrary;

/*
@id ws KBaseRBTnSeq.TnSeqLibrary
*/
typedef string tnseq_library_ref;


/*
  A BarSeqExperiment is an experiment in which a pool is grown in
  several parallel aliquots (e.g., wells or tubes), each potentially
  treated with a different set of conditions
  BarSeqExperiment object represents only one such condition
@optional person mutant_lib_name tnseq_library
*/
typedef structure {
    string person;
    string mutant_lib_name;
    string start_date;
    string sequenced_at;
    growth_parameters_ref growth_parameters;
    list<condition_ref> conditions;
    tnseq_library_ref tnseq_library;
} BarSeqExperiment;

/*
@id ws KBaseRBTnSeq.BarSeqExperiment
*/
typedef string barseq_experiment_ref;

/*
  Number of times a barcode (i.e. a strain) was detected by sequencing a pool at beginning (refernce state)
  and at the end of GrowthParameters, and a calculated log ratio of strain abundance relative to a starting
  condition.
  feature_ref - optional, if strain_index is NA and log ratio corresponds to a gene, not a strain
  strain_index - index of a strain in Pool.strains list
  count_begin - number of instances of the strain identified from sequencing at the beginning of experiment
  count_end - at the end of experiment
  norm_log_ratio - normalized log ratio between count_end and count_begin
*/
typedef tuple<feature_ref f_ref,int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;

/*
 A single (i.e. one condition) BarSeq experiment
 barseq_experiment_ref - describes the experiment
 bar_seq_result - list of counts. Can be per gene or per strain.
*/
typedef tuple<barseq_experiment_ref experiment, bar_seq_result results> bar_seq_exp;

/*
  BarSeqExperimentResults stores the log ratios calculated from
  a BarSeqExperiment.  There is one log ratio per strain or per gene per
  GrowthParameters.
  May contain a number of BarSeqExperiment done on same species.
*/
typedef structure {
    genome_ref genome;
    list<bar_seq_exp> experiments;
} BarSeqExperimentResults;

/*
@id ws KBaseRBTnSeq.BarSeqExperimentResults
*/
typedef string barseq_experiment_results_ref;

/*
  Computes essential genes from a TnSeq pool
  Input: tnseq_library_ref - reference to a TnSeqLibrary
  Output: list of genes 
*/
funcdef essential_genes(tnseq_library_ref) returns (list<feature_ref>) authentication required;

/*
  Computes essential genes from a BarSeq experiment
  Input: barseq_experiment_results_ref - reference to a BarSeqExperimentResults object
  Output: list of genes 
*/
funcdef essential_genes(barseq_experiment_results_ref) returns (list<feature_ref>) authentication required;

/*
  Computes gene fitness within a TnSeq pool
  Input: tnseq_library_ref - reference to a TnSeqLibrary
  Output: list of genes with their fitness
*/
funcdef gene_fitness(tnseq_library_ref) returns (list<tuple<feature_ref gene, float fitness>>) authentication required;

/*
  Computes gene fitness from a BarSeq experiment
  Input: barseq_experiment_results_ref - reference to a BarSeqExperimentResults object
  Output: list of genes with their fitness
*/
funcdef gene_fitness(barseq_experiment_results_ref) returns (list<tuple<feature_ref gene, float fitness>>) authentication required;

};
