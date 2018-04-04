#!/bin/bash

usage() { 
	echo
	echo "---------------------------------------"
	echo "Astrometry-api-lite installation script"
	echo "---------------------------------------"
	echo
	echo "Installs the astrometry-api-lite to this directory and also"
	echo "optionally installs its dependencies."
	echo 
	echo "Usage: $0 -l <0|1> -a <0|1> [-i <string>] -u <string> -p <num>"
	echo "       -s <0|1> -d <0|1> -c <0|1> -j <num> -o <0|1> -n <0|1>"
	echo "       -z <num>"
	echo 
	echo "Alternatively: $0 \$(< argsfile)"
	echo
	echo "Parameters:"
	echo "<0|1> means no/yes, ie. '-l 1' means 'install api-lite'"
	echo
	echo "  -l   install the latest api-lite package from github "
	echo "  -a   install astrometry.net package using apt-get"
	echo "  -i   install astrometry.net index files, a comma separated"
	echo "         string with index scale numbers, from 0 to 19,"
	echo "         eg. '-i 4,5,6,7,8'. Optional parameter."
	echo "  -u   set upload directory in configuration"
	echo "  -p   set port in configuration"
	echo "  -s   enable Swagger UI in configuration"
	echo "  -d   enable Dashboard in configuration"
	echo "  -c   enable job canceling in Dashboard"
	echo "  -j   set maximum concurrent jobs in configuration"
	echo "  -o   enable detected objects image storing in configuration"
	echo "  -n   enable annotation image storing in configuration"
	echo "  -z   set stored image scaling factor in configuration"

}

# v1.1.0 release.
RELEASE_VER="1.1.0"
SOURCE_PACKAGE="https://github.com/Jusas/astrometry-api-lite/archive/v${RELEASE_VER}.zip"

INST_APILITE=
INST_ASTROMETRYNET=
INST_INDEXES=
INST_UPLOAD_DIR=
INST_API_PORT=
INST_SWAGGER=
INST_DASHBOARD=
INST_DASHBOARD_CANCEL=
INST_MAXJOBS=
INST_STORE_OBJIMG=
INST_STORE_ANNOTATIONS=
INST_IMG_SCALE=

if [ "$1" == "--help" ]; then
	usage
	exit 0
fi

while getopts l:a:i:u:p:s:d:c:j:o:n:z: option
do
		case "${option}"
		in
			l) INST_APILITE=${OPTARG};;
			a) INST_ASTROMETRYNET=${OPTARG};;
			i) INST_INDEXES=${OPTARG};;
			u) INST_UPLOAD_DIR=${OPTARG};;
			p) INST_API_PORT=${OPTARG};;
			s) INST_SWAGGER=${OPTARG};;
			d) INST_DASHBOARD=${OPTARG};;
			c) INST_DASHBOARD_CANCEL=${OPTARG};;
			j) INST_MAXJOBS=${OPTARG};;
			o) INST_STORE_OBJIMG=${OPTARG};;
			n) INST_STORE_ANNOTATIONS=${OPTARG};;
			z) INST_IMG_SCALE=${OPTARG};;
			*) usage;;
		esac
done

if [ -z "${INST_APILITE}" ]; then
	usage
	exit 0
fi

## TODO default values if none given? or do we require them?

IFS=','
INST_INDEXES_ARR=($INST_INDEXES)
unset IFS;

[ "$INST_SWAGGER" -gt "0" ] && enableSwagger="yes" || enableSwagger="no"
[ "$INST_DASHBOARD" -gt "0" ] && enableDashboard="yes" || enableDashboard="no"
[ "$INST_DASHBOARD_CANCEL" -gt "0" ] && enableDashboardCancel="yes" || enableDashboardCancel="no"
[ "$INST_STORE_OBJIMG" -gt "0" ] && storeObjImg="yes" || storeObjImg="no"
[ "$INST_STORE_ANNOTATIONS" -gt "0" ] && storeAnnoImg="yes" || storeAnnoImg="no"

echo
echo "---------------------------------------"
echo "Astrometry-api-lite installation script"
echo "---------------------------------------"
echo
echo "Starting installation..."
echo 
echo "Using the following configuration:"
if [ "${INST_APILITE}" -gt "0" ]; then
	echo "- Installing API to $(pwd)"
	echo "- Configuring API:"
	echo "    Enable Swagger: $enableSwagger"
	echo "    Enable Dashboard: $enableDashboard"
	echo "    Enable Dashboard job canceling: $enableDashboardCancel"
	echo "    Set API port to: $INST_API_PORT"
	echo "    Set file upload dir to: $INST_UPLOAD_DIR"
	echo "- Configuring Manager/Workers:"
	echo "    Max concurrent jobs: $INST_MAXJOBS"
	echo "    Store object detection images: $storeObjImg"
	echo "    Store annotation images: $storeAnnoImg"
	echo "    Image scale when storing: $INST_IMG_SCALE"
fi
if [ "$INST_ASTROMETRYNET" == "1" ]; then
	echo "- Installing astrometry.net"
fi
if [ ! -z "$INST_INDEXES" ]; then
	echo "- Downloading astrometry.net indexes, to:"
	echo "    $(pwd)/indexes"
	echo "- Indexes to download:"
	for i in "${INST_INDEXES_ARR[@]}"
	do
		printf "    index-42%02d*.fits\n" $i
	done	
fi
echo
echo "========================== NOTE! =========================="
echo " Password will be requested to run installations with sudo"
echo "==========================================================="
echo
echo "Starting..."
sleep 3

echo
echo "Checking prerequisites..."
echo
echo "Unzip:"
unzip_ok=$(dpkg-query -W --showformat='${Status}\n' unzip|grep "install ok installed")
echo "$unzip_ok"
if [ "" == "$unzip_ok" ]; then
  echo "No unzip installed. Setting up unzip with apt-get..."
  if ! output=$(sudo apt-get --yes install unzip); then
		echo "ERROR: unzip install failed, cannot continue."
		printf "EXITING FROM ERROR" > install-outcome.txt
		exit $?
	fi	
fi

echo "wget:"
wget_ok=$(dpkg-query -W --showformat='${Status}\n' wget|grep "install ok installed")
echo "$wget_ok"
if [ "" == "$wget_ok" ]; then
  echo "No wget installed. Setting up wget with apt-get..."
  if ! output=$(sudo apt-get --yes install wget); then
		echo "ERROR: wget install failed, cannot continue."
		printf "EXITING FROM ERROR" > install-outcome.txt
		exit $?
	fi	
fi

if [ "$INST_APILITE" ]; then

	echo "NodeJS: $node_ok"
	node_ok=$(dpkg-query -W --showformat='${Status}\n' nodejs|grep "install ok installed")
	echo "$node_ok"	
	if [ "" == "$node_ok" ]; then
		echo "NodeJS is not installed. Installing Debian packages from NodeSource."
		echo "This may take a while, hang on..."
		if ! output=$(wget -qO- https://deb.nodesource.com/setup_8.x | sudo -E bash -); then
			echo "ERROR: failed to install NodeJS, cannot continue."
			printf "EXITING FROM ERROR" > install-outcome.txt
			exit $?
		fi
		if ! output=$(sudo apt-get install -y nodejs); then
			echo "ERROR: failed to install NodeJS, cannot continue."
			printf "EXITING FROM ERROR" > install-outcome.txt
			exit $?
		fi
	fi

	node_ver=$(dpkg-query -W --showformat='${source:Version}\n' nodejs)
	node_major="${node_ver:0:1}"
	if [ "$node_major" -lt "8" ]; then
		echo "WARNING: Installed NodeJS version is < 8, things may not work as expected."
		echo "         You may need to consider installing a newer version."
	else
		echo "NodeJS version: ${node_ver}"
	fi

	echo
	echo "Downloading astrometry-api-lite source archive..."
	if ! output=$(wget -q -O astrometry-api-lite.zip ${SOURCE_PACKAGE}); then
		echo "ERROR: Failed to download astrometry-api-lite package (${SOURCE_PACKAGE}), cannot continue."
		printf "EXITING FROM ERROR" > install-outcome.txt
		exit $?
	fi


	echo
	echo "Unzipping astrometry-api-lite"
	unzip -q astrometry-api-lite.zip
	mv astrometry-api-lite-${RELEASE_VER}/* .
	rm -rf astrometry-api-lite-${RELEASE_VER}
	rm astrometry-api-lite.zip

	echo
	echo "Installing astrometry-api-lite..."
	if ! output=$(npm install); then
		echo "ERROR: Failed to install astrometry-api-lite, cannot continue"
		printf "EXITING FROM ERROR" > install-outcome.txt
		exit $?
	fi
	echo "Running build..."
	if ! output=$(npm run all:build); then
		echo "ERROR: Failed to install astrometry-api-lite, cannot continue"
		printf "EXITING FROM ERROR" > install-outcome.txt
		exit $?
	fi

	echo
	echo "Configuring astrometry-api-lite..."
	if [ ! -z "$INST_API_PORT" ]; then
		sed "s/\(\"apiPort\":\)\([ tab]*\)\([0-9]\+\)/\1${INST_API_PORT}/" src/api/configuration.json > dist/api/configuration.json
	fi
	if [ ! -z "$INST_SWAGGER" ]; then
		swag="false"
		if [ "$INST_SWAGGER" -gt "0" ]; then
			swag="true"
		fi
		sed "s/\(\"enableSwagger\":\)\([ tab]*\)\([0-9]\+\)/\1${swag}/" src/api/configuration.json > dist/api/configuration.json
	fi
	if [ ! -z "$INST_DASHBOARD" ]; then
		dash="false"
		if [ "$INST_DASHBOARD" -gt "0" ]; then
			dash="true"
		fi
		sed "s/\(\"enableDashboard\":\)\([ tab]*\)\([0-9]\+\)/\1${dash}/" src/api/configuration.json > dist/api/configuration.json
	fi
	if [ ! -z "$INST_DASHBOARD_CANCEL" ]; then
		dashc="false"
		if [ "$INST_DASHBOARD_CANCEL" -gt "0" ]; then
			dashc="true"
		fi
		sed "s/\(\"enableJobCancellationApi\":\)\([ tab]*\)\([0-9]\+\)/\1${dashc}/" src/api/configuration.json > dist/api/configuration.json
	fi
	if [ ! -z "$INST_UPLOAD_DIR" ]; then
		safeDirStr=$(echo "$INST_UPLOAD_DIR" | sed -r 's/\//\\\//g')
		sed "s/\(\"queueFileUploadDir\":\)\([ tab]*\)\([0-9]\+\)/\1${safeDirStr}/" src/api/configuration.json > dist/api/configuration.json
		sed "s/\(\"queueFileUploadDir\":\)\([ tab]*\)\([0-9]\+\)/\1${safeDirStr}/" src/worker/configuration.json > dist/worker/configuration.json
	fi
	if [ ! -z "$INST_MAXJOBS" ]; then
		sed "s/\(\"maxConcurrentWorkers\":\)\([ tab]*\)\([0-9]\+\)/\1${INST_MAXJOBS}/" src/manager/configuration.json > dist/manager/configuration.json
	fi
	if [ ! -z "$INST_STORE_OBJIMG" ]; then
		objImg="false"
		if [ "$INST_STORE_OBJIMG" -gt "0" ]; then
			objImg="true"
		fi
		sed "s/\(\"storeObjsImages\":\)\([ tab]*\)\([0-9]\+\)/\1${objImg}/" src/worker/configuration.json > dist/worker/configuration.json
	fi
	if [ ! -z "$INST_STORE_ANNOTATIONS" ]; then
		anno="false"
		if [ "$INST_STORE_ANNOTATIONS" -gt "0" ]; then
			anno="true"
		fi
		sed "s/\(\"storeNgcImages\":\)\([ tab]*\)\([0-9]\+\)/\1${anno}/" src/worker/configuration.json > dist/worker/configuration.json
	fi
	if [ ! -z "$INST_IMG_SCALE" ]; then
		sed "s/\(\"imageScale\":\)\([ tab]*\)\([0-9.]\+\)/\1${INST_IMG_SCALE}/" src/worker/configuration.json > dist/worker/configuration.json
	fi
	

fi

if [ ! -z "$INST_ASTROMETRYNET" ] && [ "$INST_ASTROMETRYNET" -gt "0" ]; then
	echo
	echo "Installing astrometry.net"

	anet_ok=$(dpkg-query -W --showformat='${Status}\n' astrometry.net|grep "install ok installed")
	echo
	echo "Checking for astrometry.net installation: $anet_ok"
	if [ "" == "$anet_ok" ]; then
		echo "astrometry.net is not installed. Installing Debian packages with apt-get."
		if ! output=$(sudo apt-get --yes install astrometry.net); then
			echo "ERROR: failed to install astrometry.net, cannot continue."
			printf "EXITING FROM ERROR" > install-outcome.txt
			exit $?
		fi	
	fi
fi

if [ ! -z "$INST_INDEXES" ]; then
	echo
	echo "Installing astrometry.net indexes"

	# indexes 8-19 = 1 file each
	# indexes 5-7 = 12 files each
	# indexes 0-4 = 48 files each

	data_url="http://data.astrometry.net/4200"

	totalFileCount=0
	for i in "${INST_INDEXES_ARR[@]}"
	do
		if [ "$i" -ge "8" ]; then
			totalFileCount=$((totalFileCount+1))
		fi
		if [ "$i" -ge "5" ] && [ "$i" -le "7" ]; then
			totalFileCount=$((totalFileCount+12))
		fi
		if [ "$i" -ge "0" ] && [ "$i" -le "4" ]; then
			totalFileCount=$((totalFileCount+48))
		fi
	done

	echo "Total files to download: ${totalFileCount}"
	echo
	fcount=0

	for i in "${INST_INDEXES_ARR[@]}"
	do
		idx=$(printf %02d ${i})
		if [ "$i" -ge "8" ]; then
			fcount=$((fcount+1))
			fits="${data_url}/index-42${idx}.fits";
			echo "(${fcount}/${totalFileCount}) Downloading ${fits}"
			if ! output=$(wget -q --show-progress -P ./indexes -c ${fits}); then
				echo "WARNING: download of an index file failed - continuing"
			fi
		fi
		if [ "$i" -ge "5" ] && [ "$i" -le "7" ]; then
			idx_list=($(seq -s" " -w 0 11))
			for n in "${idx_list[@]}"
			do
				fcount=$((fcount+1))
				fits="${data_url}/index-42${idx}-${n}.fits";
				echo "(${fcount}/${totalFileCount}) Downloading ${fits}"
				if ! output=$(wget -q --show-progress -P ./indexes -c ${fits}); then
					echo "WARNING: download of an index file failed - continuing"
				fi
			done
		fi
		if [ "$i" -ge "0" ] && [ "$i" -le "4" ]; then
			idx_list=($(seq -s" " -w 0 47))
			for n in "${idx_list[@]}"
			do
				fcount=$((fcount+1))
				fits="${data_url}/index-42${idx}-${n}.fits";
				echo "(${fcount}/${totalFileCount}) Downloading ${fits}"
				if ! output=$(wget -q --show-progress -P ./indexes -c ${fits}); then
					echo "WARNING: download of an index file failed - continuing"
				fi
			done
		fi
	done

	added_paths=($(sed -n '/add_path/p' /etc/astrometry.cfg))
	index_path_added=0
	index_path="$(pwd)/indexes"
	for path in "${added_paths[@]}"
	do
		if [ "$path" == "$index_path" ]; then
			index_path_added=1
			break
		fi
	done

	if [ "$index_path_added" == "0" ]; then
		echo "Adding index path to /etc/astrometry.cfg"
		echo "add_path ${index_path}" | sudo tee -a /etc/astrometry.cfg > /dev/null
	fi

fi

printf "OK" > install-outcome.txt

echo
echo "======================================================================"
echo "Installation complete!"
echo "======================================================================"
echo
read -p "Press any key..." x

exit 0