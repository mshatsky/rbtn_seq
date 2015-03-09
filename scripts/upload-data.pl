#!/usr/bin/perl

use strict;
use warnings;

use utf8;

use DBI;
use LWP::Simple;
use Data::Dumper;
use HTML::Entities;
use Encode;
use Unicode::String qw(utf8);
use HTML::Strip;
use HTML::TableExtract;
use Time::localtime;
 

if (@ARGV < 2) {
my $usage = <<EOF;
file_with_meta_data file_with_logratios 
EOF
	print $usage;
	exit 1;  
} 

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


while(<FILE>){
    chomp;
    my @l = split /\t/, $_;
    die "Wrong number of columns in data file, line $_\n",scalar(@l)," expected ", scalar(@headerData), "as in the first line.\n" 
	if scalar(@l) != scalar(@headerData);
    
    my ($locusId, $sysName, $desc, $comb, @lratios) = @l;

    for(my $i=0; $i<= $#lratios; ++$i){
	#$meta{ $ExpNameIndex }{ $header[$i] } = $l[ $i ];
    }
}

close FILE;


###################################################
use Bio::KBase::workspace::ScriptHelpers qw(get_ws_client workspace printObjectInfo);

#lookup version number of WS Service that will be loading the data
my $ws_ver = '';
if ($opt->{showerror} == 0){
        eval { $ws_ver = $serv->ver(); };
        if($@) {
                print "Object could not be saved! Error connecting to the WS server.\n";
                print STDERR $@->{message}."\n";
                if(defined($@->{status_line})) {print STDERR $@->{status_line}."\n" };
                print STDERR "\n";
                exit 1;
        }
} else{
        $ws_ver = $serv->ver();
}

# set provenance info
my $PA = {
                "service"=>"Workspace",
                "service_ver"=>$ws_ver,
                "script"=>"ws-load",
                "script_command_line"=>$fullCommand
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
        $saveObjectsParams->{id}=$opt->{workspace}+0;
} else { #is name
        $saveObjectsParams->{workspace}=$opt->{workspace};
}

#Calling the server
my $output;
if ($opt->{showerror} == 0){
        eval { $output = $serv->$servercommand($saveObjectsParams); };
        if($@) {
                print "Object could not be saved!\n";
                print STDERR $@->{message}."\n";
                if(defined($@->{status_line})) {print STDERR $@->{status_line}."\n" };
                print STDERR "\n";
                exit 1;
        }
} else{
        $output = $serv->$servercommand($saveObjectsParams);
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
