# rbtn_seq

#register BarSeqExperimentResults with workspace
ws-typespec-register -u mshatsky  -t KBaseRBTnSeq.spec --add "BarSeqExperimentResults" --commit
ws-typespec-register -u mshatsky  -release KBaseRBTnSeq


Widgets:

widgets/kbaseBarSeqExperimentResults.js
should be placed into:
narrative/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/js/widgets/function_output/

add:
<script src="{{ static_url("kbase/js/widgets/function_output/kbaseBarSeqExperimentResults.js") }}" type="text/javascript" charset="utf-8"></script>
to:
narrative/src/notebook/ipython_profiles/profile_narrative/kbase_templates/notebook.html


Additional dependencies:

widgets/extra/types/KBaseRBTnSeq.BarSeqExperimentResults/
should be placed into 
narrative_method_specs_ci/types/

widgets/extra/methods/view_barseq_results/
should be placed into
narrative_method_specs_ci/methods

