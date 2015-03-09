#!/usr/bin/perl

use strict;
use warnings;
use Getopt::Long;

my $usage = 
"file_with_meta_data file_with_logratios <-w workspace> <-n object_name>
";

my $workspace = "";
my $object_name = "new";

(GetOptions('w=s' => \$workspace, 
	    'n=s' => \$object_name) and scalar(@ARGV) >= 2)    || die $usage;

my ($FNM_META, $FNM_LOGRT) = @ARGV;

die "Can't open file $FNM_META\n" if ! -e $FNM_META;
die "Can't open file $FNM_LOGRT\n" if ! -e $FNM_LOGRT;

#####################################################
#readin file with metadata
#####################################################
my %meta = ();
open FILE, $FNM_META or die $!;

#get header
my @header = split /\t/, <FILE>;
die "Wrong number of columns ".scalar(@header)." expected 35\n" if scalar(@header)!=35;

#find experiment name index
my @index = grep { $header[$_] =~ /name/ } 0..$#header;
die "Multiple or non existent field in the meta file the header 'name'\n" if scalar(@index)!=1;
my $ExpNameIndex = $index[0];

while(<FILE>){
    chomp;
    my @l = split /\t/, $_;
    die "Wrong number of columns in meta file, line $_\n",scalar(@l)," expected 35\n" if scalar(@l)!=35;
    
    for(my $i=0; $i<= $#l; ++$i){
	$meta{ $l[$ExpNameIndex] }{ $header[$i] } = $l[ $i ];
    }
}
close FILE;

#####################################################
#readin file with log ratios
##################################################### 
my %data = ();
open FILE, $FNM_LOGRT or die $!;

#get header
my @headerData = split /\t/, <FILE>;
die "Too few columns in data file ".scalar(@headerData)."\n" if scalar(@headerData)<5;

#trim experiment annotations, keep only experiment names
foreach (@headerData){
    ($_) = split;
}

for(my $i=4; $i<= $#headerData; ++$i){
    die "Experiment ".$headerData[$i]." is not in meta file\n" if !exists $meta{ $headerData[$i] };
}
#foreach (@headerData){
#    print "test: $_\n";
#    print "ok\n" if exists $meta{$_};
#}


#typedef structure {
#    barseq_experiment_ref experiment;
#    list<bar_seq_result> results;
#} BarSeqExperimentResults;
my %brseqdata=(); #hash of many BarSeqExperimentResults

while(<FILE>){
    chomp;
    my @l = split /\t/, $_;
    die "Wrong number of columns in data file, line $_\n",scalar(@l)," expected ", scalar(@headerData), "as in the first line.\n" 
	if scalar(@l) != scalar(@headerData);
    
    my ($locusId, $sysName, $desc, $comb, @lratios) = @l;

    for(my $i=0; $i<= $#lratios; ++$i){
	#fill in data
	#typedef tuple<int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;
	my @res = (0,0,0,$lratios[ $i ]);
	push @{$brseqdata{ $headerData[ $i + 4 ] }{ results }}, [ @res ];	
    }
}
close FILE;

#fill in experiment field
foreach (keys $brseqdata){
    $brseqdata{ $_ }{ experiment } = "$_";
}


#try the first one
$params->{data} = $brseqdata{  $headerData[4] };

###################################################
my $params = {
       "id" => $object_name,
       "type" => "KBaseRBTnSeq.BarSeqExperimentResults-0.1",
       workspace => $workspace,
       metadata => "NA"
};

###################################################
use Bio::KBase::workspace::ScriptHelpers qw(get_ws_client workspace printObjectInfo);

my $serv = get_ws_client();

#lookup version number of WS Service that will be loading the data
my $ws_ver = '';
eval { $ws_ver = $serv->ver(); };
if($@) {
    print "Object could not be saved! Error connecting to the WS server.\n";
    print STDERR $@->{message}."\n";
    if(defined($@->{status_line})) {print STDERR $@->{status_line}."\n" };
    print STDERR "\n";
    exit 1;
}

# set provenance info
my $PA = {
                "service"=>"Workspace",
                "service_ver"=>$ws_ver,
                "script"=>"upload-data.pl",
                "script_command_line"=> "@ARGV"
          };
$params->{provenance} = [ $PA ];


# setup the new save_objects parameters
my $saveObjectsParams = {
                "objects" => [
                           {
                                "data"  => $params->{data},
                                "name"  => $params->{id},
                                "type"  => $params->{type},
                                "meta"  => $params->{metadata},
                                "provenance" => $params->{provenance}
                           }
                        ]
        };
if ($params->{workspace} =~ /^\d+$/ ) { #is ID
        $saveObjectsParams->{id}=$workspace+0;
} else { #is name
        $saveObjectsParams->{workspace}=$workspace;
}

#Calling the server
my $output;
eval { $output = $serv->save_objects($saveObjectsParams); };
if($@) {
    print "Object could not be saved!\n";
    print STDERR $@->{message}."\n";
    if(defined($@->{status_line})) {print STDERR $@->{status_line}."\n" };
    print STDERR "\n";
    exit 1;
}

#Report the results
print "Object saved.  Details:\n";
if (scalar(@$output)>0) {
        foreach my $object_info (@$output) {
                printObjectInfo($object_info);
        }
} else {
        print "No details returned!\n";
}
print "\n";
exit(0);
