!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "TextFunc.nsh"
!include "x64.nsh"
!include "winver.nsh"
!include "strrep.nsh"
!include "strcase.nsh"
!include "linkopen.nsh"

!define VERSION "v1.2.0"
!define APP_VERSION "Astrometry-api-lite ${VERSION}"

Name "Astrometry-api-lite ${VERSION}"
OutFile "install_${VERSION}.exe"
InstallDir "C:\astrometry-api-lite"



RequestExecutionLevel user

!define MUI_ICON "inst.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Astrometry-api-lite installer for Windows 10 Subsystem for Linux"
!define MUI_WELCOMEPAGE_TEXT "This installer will help you configure and install the Astrometry-api-lite to your machine. After completing the steps, an installation configuration file will be created and an automatic installation script will be run to install all the required software components to your Windows 10 Subsystem for Linux to run Astrometry-api-lite."
!define MUI_WELCOMEFINISHPAGE_BITMAP "welcome.bmp"
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose a directory where you want to install the API files. Note that installing under Program Files may cause problems with file permissions. Note: this Windows installer won't install any files: the download of files will be performed by the bash script once you've completed configuring. NOTE: If you choose to download index files, they will be placed in a subdirectory under this installation directory."
!define MUI_COMPONENTSPAGE_SMALLDESC 
!define MUI_COMPONENTSPAGE_TEXT_TOP "Select what to install. Regarding the index files, quoting astrometry.net readme rule of thumb/example: for 1-deg FOV you should grab images of size 0.1 to 1 deg (6-60 arcmin). Recommendation: select only what you really need. The indexes are BIG."

Var StartMenuFolder

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
Page custom CheckInstallStatus
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
; configuration custom pages here (api, processing)
Page custom PreJobSettings
Page custom ApiSettings ApiSettingsLeave
Page custom DashboardSettings DashboardSettingsLeave
Page custom JobSettings JobSettingsLeave
Page custom JobSettings2 JobSettings2Leave
Page custom SaveConfig
!insertmacro MUI_PAGE_INSTFILES
Page custom RunBashScript
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Var HasWin10
Var HasSubSysLinux
Var HasStuffErrorText

Var CheckDialog
Var SaveConfigDialog
Var RunBashScriptDialog

Var CfgDialogApi
Var CfgDialogProcessing
Var CfgDialogDashboard

Var CfgQueueFileUploadDir_Field
Var CfgQueueFileUploadDir_Val
Var CfgApiPort_Field
Var CfgApiPort_Val
Var CfgSwagger_CB
Var CfgSwagger_Val
Var CfgDashboard_CB
Var CfgDashboard_Val
Var CfgJobCancelApi_CB
Var CfgJobCancelApi_Val
Var CfgConfEditApi_CB
Var CfgConfEditApi_Val

Var CfgTempFileDir_Field
Var CfgTempFileDir_Val
Var CfgMaxConcurrentWorkers_Field
Var CfgMaxConcurrentWorkers_Val
Var CfgStoreObjsImages_CB
Var CfgStoreObjsImages_Val
Var CfgStoreNgcImages_CB
Var CfgStoreNgcImages_Val
Var CfgImageScale_Field
Var CfgImageScale_Val

Var CfgSigma_Field
Var CfgSigma_Val
Var CfgDepth_Field
Var CfgDepth_Val

Var LinuxInstallDir
Var InstallSuccess
Var DidInstallApi


Function CheckInstallStatus
	!insertmacro MUI_HEADER_TEXT "Installation status check" "Checking what you have installed"

	nsDialogs::Create 1018
	Pop $CheckDialog

	${If} $CheckDialog == error
		Abort
	${EndIf}
	; green "0x21b127"
	; red "0xd12222"
	${NSD_CreateLabel} 0 17 240 20 "* Have Windows 10..."
	Pop $0
	${NSD_CreateLabel} 0 37 240 20 "* Have Windows Subsystem for Linux..."
	Pop $0
	
	${GetWindowsVersion} $R0
	${If} $R0 == "10.0"
		StrCpy $HasWin10 "YES"
	${Else}
		StrCpy $HasWin10 "NO"
	${EndIf}
	
	${DisableX64FSRedirection}
	IfFileExists "$WINDIR\System32\bash.exe" SubSysCheckOk SubSysCheckFail

	SubSysCheckOk:
		StrCpy $HasSubSysLinux "YES"
		Goto SubSysCheckDone

	SubSysCheckFail:
		StrCpy $HasSubSysLinux "NO"
		Goto SubSysCheckDone

	SubSysCheckDone:

		${NSD_CreateLabel} 240 17 30 20 $HasWin10
		Pop $0
		${If} $HasWin10 == "YES"
			SetCtlColors $0 "0x21b127" transparent
		${Else}
			SetCtlColors $0 "0xd12222" transparent
		${EndIf}

		${NSD_CreateLabel} 240 37 30 20 $HasSubSysLinux
		Pop $0
		${If} $HasSubSysLinux == "YES"
			SetCtlColors $0 "0x21b127" transparent
		${Else}
			SetCtlColors $0 "0xd12222" transparent
		${EndIf}

		${If} $HasWin10 == "YES"
		${AndIf} $HasSubSysLinux == "YES"
			StrCpy $HasStuffErrorText "Looks good! Windows 10 and the Subsystem for Linux are the requirements for this to work. We can proceed."
		${EndIf}

		${If} $HasWin10 == "NO"
		${OrIf} $HasSubSysLinux == "NO"
			StrCpy $HasStuffErrorText "Oh no! The Windows installation requires both Windows 10 and the Windows 10 Subsystem for Linux installed. Without those, we can't continue. The Subsystem for Linux (Ubuntu recommended) can be installed from the Windows Store."
			GetDlgItem $0 $HWNDPARENT 1
			EnableWindow $0 0
		${EndIf}

		${NSD_CreateLabel} 0 100 380 80 $HasStuffErrorText
	
		${EnableX64FSRedirection}
		nsDialogs::Show

FunctionEnd

Function ApiSettings
; todo: select worker, api, manager config options.
!insertmacro MUI_HEADER_TEXT "API settings" "Choose the API settings"

 	nsDialogs::Create 1018
 	Pop $CfgDialogApi

 	${If} $CfgDialogApi == error
 		Abort
 	${EndIf}
; 	; green "0x21b127"
; 	; red "0xd12222"
 	${NSD_CreateLabel} 0 0 300 20 "API file upload directory (where to temp store uploaded files)"
	Pop $0
	${NSD_CreateDirRequest} 0 20 300 12u "$INSTDIR\uploads"
	Pop $CfgQueueFileUploadDir_Field
	${NSD_CreateBrowseButton} 320 20 100 12u "Browse"
	Pop $0
	${NSD_OnClick} $0 "OnUploadDirBrowse"

	${NSD_CreateLabel} 0 70 500 20 "API port (note: 80 will require running the API with root permissions, not recommended)"
	Pop $0
	${NSD_CreateText} 0 90 100 12u "3000"
	Pop $CfgApiPort_Field

	;${NSD_CreateLabel} 0 80 300 20 "Enable Swagger UI (a simple web interface for testing the API)"
	;Pop $0
	${NSD_CreateCheckBox} 0 140 400 20 "Enable Swagger UI (a simple web interface for testing the API)"
	Pop $CfgSwagger_CB
	${NSD_CreateBitmap} 0 165 354 57 ""
	Pop $0
	${NSD_SetImage} $0 "$PLUGINSDIR\swagger.bmp" $1

	nsDialogs::Show
FunctionEnd

Function ApiSettingsLeave
	${NSD_GetText} $CfgQueueFileUploadDir_Field $CfgQueueFileUploadDir_Val
	${NSD_GetText} $CfgApiPort_Field $CfgApiPort_Val
	${NSD_GetState} $CfgSwagger_CB $CfgSwagger_Val
	; TODO validation
FunctionEnd

Function DashboardSettings
  !insertmacro MUI_HEADER_TEXT "API dashboard" "Enabling the dashboard"

 	nsDialogs::Create 1018
 	Pop $CfgDialogDashboard

 	${If} $CfgDialogDashboard == error
 		Abort
 	${EndIf}
; 	; green "0x21b127"
; 	; red "0xd12222"
 	${NSD_CreateLabel} 0 0 500 20 "The Dashboard is a simple web interface that enables you to monitor and manage jobs."
	Pop $0

	${NSD_CreateBitmap} 0 20 354 127 ""
	Pop $0
	${NSD_SetImage} $0 "$PLUGINSDIR\dashboard.bmp" $1

	${NSD_CreateCheckBox} 0 155 400 20 "Enable Dashboard"
	Pop $CfgDashboard_CB
  ${NSD_Check} $CfgDashboard_CB
	
	${NSD_CreateCheckBox} 0 180 400 20 "Enable job canceling from dashboard (not recommended for public APIs)"
	Pop $CfgJobCancelApi_CB
  ${NSD_Check} $CfgJobCancelApi_CB

  ${NSD_CreateCheckBox} 0 205 400 20 "Enable configuration editor in dashboard (not recommended for public APIs)"
	Pop $CfgConfEditApi_CB
  ${NSD_Check} $CfgConfEditApi_CB

	nsDialogs::Show
FunctionEnd

Function DashboardSettingsLeave
	${NSD_GetState} $CfgDashboard_CB $CfgDashboard_Val
	${NSD_GetState} $CfgJobCancelApi_CB $CfgJobCancelApi_Val
  ${NSD_GetState} $CfgConfEditApi_CB $CfgConfEditApi_Val
FunctionEnd

Function PreJobSettings

	!insertmacro MUI_HEADER_TEXT "Configuration" "A foreword"

 	nsDialogs::Create 1018
 	Pop $CfgDialogProcessing

 	${If} $CfgDialogProcessing == error
 		Abort
 	${EndIf}
; 	; green "0x21b127"
; 	; red "0xd12222"
 	${NSD_CreateLabel} 0 0 455 40 "Just a quick note before setting the configuration: you will be able to change all the values later on if you wish. The configuration is divided into three files:"
	Pop $0

	${NSD_CreateLabel} 0 60 445 20 "- dist/api/configuration.json (API/dashboard configuration)"
	Pop $0

  ${NSD_CreateLabel} 0 80 445 20 "- dist/worker/configuration.json (Worker instance configuration)"
	Pop $0

  ${NSD_CreateLabel} 0 100 445 20 "- dist/manager/configuration.json (Manager configuration)"
	Pop $0
	
 	${NSD_CreateLabel} 0 140 455 40 "The readme document that comes with the installation contains explanation of all the parameters and how they affect things."
	Pop $0


	nsDialogs::Show
FunctionEnd

Function JobSettings
; todo: select worker, api, manager config options.
	!insertmacro MUI_HEADER_TEXT "Job/worker settings" "Page 1"

 	nsDialogs::Create 1018
 	Pop $CfgDialogProcessing

 	${If} $CfgDialogProcessing == error
 		Abort
 	${EndIf}
; 	; green "0x21b127"
; 	; red "0xd12222"
 	${NSD_CreateLabel} 0 0 445 20 "Maximum concurrently running solver jobs"
	Pop $0
	${NSD_CreateText} 0 20 40 12u "4"
	Pop $CfgMaxConcurrentWorkers_Field
	
	${NSD_CreateCheckBox} 0 65 445 30 "Store object detection images from completed jobs (stored in db, takes some space, also images take time to process)"
	Pop $CfgStoreObjsImages_CB

	${NSD_CreateCheckBox} 0 110 445 30 "Store annotation images from completed jobs (stored in db, takes some space, also images take time to process)"
	Pop $CfgStoreNgcImages_CB

	${NSD_CreateLabel} 0 155 445 20 "Image scale of saved images (use < 1.0 scale to save space)"
	Pop $0
	${NSD_CreateText} 0 175 50 12u "0.5"
	Pop $CfgImageScale_Field
	
	nsDialogs::Show
FunctionEnd

Function JobSettingsLeave
	${NSD_GetText} $CfgMaxConcurrentWorkers_Field $CfgMaxConcurrentWorkers_Val
	${NSD_GetState} $CfgStoreObjsImages_CB $CfgStoreObjsImages_Val
	${NSD_GetState} $CfgStoreNgcImages_CB $CfgStoreNgcImages_Val
	${NSD_GetText} $CfgImageScale_Field $CfgImageScale_Val
	; TODO validation
FunctionEnd

Function JobSettings2
; todo: select worker, api, manager config options.
	!insertmacro MUI_HEADER_TEXT "Job/worker settings" "Page 2"

 	nsDialogs::Create 1018
 	Pop $CfgDialogProcessing

 	${If} $CfgDialogProcessing == error
 		Abort
 	${EndIf}
; 	; green "0x21b127"
; 	; red "0xd12222"
 	${NSD_CreateLabel} 0 0 445 40 "Set sigma parameter (noise reduction, can speed up solves). 0 means do not use (default). Set this only if you know what you're doing."
	Pop $0
	${NSD_CreateText} 0 40 40 12u "0"
	Pop $CfgSigma_Field
	
	${NSD_CreateLabel} 0 85 445 40 "Set depth parameter (limit how many field objects are used for solving). 0 means do not use (default). Set this only if you know what you're doing."
  Pop $0
	${NSD_CreateText} 0 125 40 12u "0"
	Pop $CfgDepth_Field

	
	nsDialogs::Show
FunctionEnd

Function JobSettings2Leave
	${NSD_GetText} $CfgSigma_Field $CfgSigma_Val
	${NSD_GetText} $CfgDepth_Field $CfgDepth_Val	
	; TODO validation
FunctionEnd



Function OnUploadDirBrowse
	${NSD_GetText} $CfgQueueFileUploadDir_Field $0
	nsDialogs::SelectFolderDialog "Select upload file directory" "$0"
	Pop $0
	${If} $0 != error
    ${NSD_SetText} $CfgQueueFileUploadDir_Field "$0"
	${EndIf}
FunctionEnd

Section "Install script" SecInstall
	SetOutPath "$INSTDIR"
	File "install.sh"	
	File "icon.ico"
SectionEnd

Section "Astrometry.net packages (required)" SecANetPkg
SectionEnd

SectionGroup "Astrometry.net indexes (partly required)" SecIndexes
	Section "CCD FOV 1400-2000 arcsec (23-33 deg)" SecANetPkg_1
	SectionEnd
	Section "CCD FOV 1000-1400 arcsec (16-23 deg)" SecANetPkg_2
	SectionEnd
	Section "CCD FOV 680-1000 arcsec (11-16 deg)" SecANetPkg_3
	SectionEnd
	Section "CCD FOV 480-680 arcsec (8-11 deg)" SecANetPkg_4
	SectionEnd
	Section "CCD FOV 340-480 arcsec (5.6-8.0 deg)" SecANetPkg_5
	SectionEnd
	Section "CCD FOV 240-340 arcsec (4.0-5.6 deg)" SecANetPkg_6
	SectionEnd
	Section "CCD FOV 170-240 arcsec (2.8-4.0 deg)" SecANetPkg_7
	SectionEnd
	Section "CCD FOV 120-170 arcsec (2.0-2.8 deg)" SecANetPkg_8
	SectionEnd
	Section "CCD FOV 85-120 arcsec (1.4-2.0 deg)" SecANetPkg_9
	SectionEnd
	Section "CCD FOV 60-85 arcsec (1.0-1.4 deg)" SecANetPkg_10
	SectionEnd
	Section "CCD FOV 42-60 arcsec (0.7-1.0 deg)" SecANetPkg_11
	SectionEnd
	Section /o "CCD FOV 30-42 arcsec (0.5-0.7 deg)" SecANetPkg_12
	SectionEnd
	Section /o "CCD FOV 22-30 arcsec (0.4-0.5 deg)" SecANetPkg_13
	SectionEnd
	Section /o "CCD FOV 16-22 arcsec (0.3-0.4 deg)" SecANetPkg_14
	SectionEnd
	Section /o "CCD FOV 11-16 arcsec (0.2-0.3 deg)" SecANetPkg_15
	SectionEnd
	Section /o "CCD FOV 8-11 arcsec (0.1-0.2 deg)" SecANetPkg_16
	SectionEnd
	Section /o "CCD FOV 5.6-8.0 arcsec (0.09-0.1 deg)" SecANetPkg_17
	SectionEnd
	Section /o "CCD FOV 4.0-5.6 arcsec (0.07-0.09 deg)" SecANetPkg_18
	SectionEnd
	Section /o "CCD FOV 2.8-4.0 arcsec (0.05-0.07 deg)" SecANetPkg_19
	SectionEnd
	Section /o "CCD FOV 2.0-2.8 arcsec (0.03-0.05 deg)" SecANetPkg_20
	SectionEnd
SectionGroupEnd

Section "${APP_VERSION}" SecApi
SectionEnd


Function SaveConfig
	!insertmacro MUI_HEADER_TEXT "Configuration saved" ""

	CreateDirectory "$INSTDIR"
	FileOpen $1 "$INSTDIR\install.args" w

	StrCpy $2 ""
	StrCpy $3 ""
	StrCpy $9 ""
	StrCpy $8 ""
	StrCpy $4 ""

  ;{NSD_GetState} $somecbox $output
	${If} ${SectionIsSelected} ${SecApi}
		StrCpy $2 "$2 -l 1"
		StrCpy $DidInstallApi "1"
	${Else} 
		StrCpy $2 "$2 -l 0"
	${EndIf}

	${If} ${SectionIsSelected} ${SecANetPkg}
		StrCpy $2 "$2 -a 1"
	${Else} 
		StrCpy $2 "$2 -a 0"
	${EndIf}


	${If} ${SectionIsSelected} ${SecANetPkg_1}
		StrCpy $9 "$9,19"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_2}
		StrCpy $9 "$9,18"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_3}
		StrCpy $9 "$9,17"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_4}
		StrCpy $9 "$9,16"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_5}
		StrCpy $9 "$9,15"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_6}
		StrCpy $9 "$9,14"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_7}
		StrCpy $9 "$9,13"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_8}
		StrCpy $9 "$9,12"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_9}
		StrCpy $9 "$9,11"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_10}
		StrCpy $9 "$9,10"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_11}
		StrCpy $9 "$9,9"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_12}
		StrCpy $9 "$9,8"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_13}
		StrCpy $9 "$9,7"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_14}
		StrCpy $9 "$9,6"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_15}
		StrCpy $9 "$9,5"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_16}
		StrCpy $9 "$9,4"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_17}
		StrCpy $9 "$9,3"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_18}
		StrCpy $9 "$9,2"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_19}
		StrCpy $9 "$9,1"	
	${EndIf}
	${If} ${SectionIsSelected} ${SecANetPkg_20}
		StrCpy $9 "$9,0"	
	${EndIf}
	StrCpy $9 $9 "" 1

	StrLen $8 $9

	; only if we have some selected
	${If} $8 > 0
		StrCpy $2 "$2 -i "
		StrCpy $2 "$2 $9"
	${EndIf}

	; C
	StrCpy $4 $CfgQueueFileUploadDir_Val 1 0
	; c
	${StrCase} $4 $4 "L"
	; :\blah
	StrCpy $5 $CfgQueueFileUploadDir_Val "" 1
	; /mnt/c:\blah
	StrCpy $3 "/mnt/$4$5"
	; /mnt/c:/blah
	${StrRep} $3 $3 '\' '/'
	; /mnt/c/blah
	${StrRep} $3 $3 ':' ''

	StrCpy $2 '$2 -u "$3" '



	StrCpy $4 $INSTDIR 1 0
	; c
	${StrCase} $4 $4 "L"
	; :\blah
	StrCpy $5 $INSTDIR "" 1
	; /mnt/c:\blah
	StrCpy $3 "/mnt/$4$5"
	; /mnt/c:/blah
	${StrRep} $3 $3 '\' '/'
	; /mnt/c/blah
	${StrRep} $3 $3 ':' ''

	StrCpy $LinuxInstallDir $3
	


	StrCpy $2 "$2 -p $CfgApiPort_Val"

	StrCpy $2 "$2 -j $CfgMaxConcurrentWorkers_Val"

	${If} $CfgSwagger_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -s 1"
	${Else}
		StrCpy $2 "$2 -s 0"
	${EndIf}
	
	${If} $CfgDashboard_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -d 1"
	${Else}
		StrCpy $2 "$2 -d 0"
	${EndIf}

	${If} $CfgJobCancelApi_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -c 1"
	${Else}
		StrCpy $2 "$2 -c 0"
	${EndIf}

  ${If} $CfgConfEditApi_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -f 1"
	${Else}
		StrCpy $2 "$2 -f 0"
	${EndIf}

	${If} $CfgStoreObjsImages_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -o 1"
	${Else}
		StrCpy $2 "$2 -o 0"
	${EndIf}

	${If} $CfgStoreNgcImages_Val == ${BST_CHECKED}
		StrCpy $2 "$2 -n 1"
	${Else}
		StrCpy $2 "$2 -n 0"
	${EndIf}

	StrCpy $2 "$2 -z $CfgImageScale_Val"

  StrCpy $2 "$2 -b $CfgSigma_Val"
  StrCpy $2 "$2 -e $CfgDepth_Val"

	FileWrite $1 $2
	FileClose $1

 	nsDialogs::Create 1018
 	Pop $SaveConfigDialog

 	${If} $SaveConfigDialog == error
 		Abort
 	${EndIf}

	${NSD_CreateLabel} 0 0 420 80 "Setup configuration has been saved to the installation directory. The next phase will launch the Bash shell and run the installation script with the saved configuration."

	Pop $0
	${NSD_CreateLabel} 0 75 420 80 "Depending on what you chose to install the installation can take some time - especially downloading the indexes can take quite a while. Please monitor and wait patiently for the script to finish running."
	Pop $0

	nsDialogs::Show

FunctionEnd

Function ReadOutcome
	${If} $9 == "EXITING FROM ERROR"
		StrCpy $InstallSuccess "false"
	${Else}
		StrCpy $InstallSuccess "true"
	${EndIf}
	StrCpy $0 StopFileReadFromEnd
	Push $0
FunctionEnd

Function RunBashScript
	${DisableX64FSRedirection}
	!insertmacro MUI_HEADER_TEXT "Installation script run" ""
	nsDialogs::Create 1018
	Pop $RunBashScriptDialog

 	${If} $RunBashScriptDialog == error
 		Abort
 	${EndIf}

	${NSD_CreateLink} 0 145 420 80 "View install log"
	Pop $0
	${NSD_OnClick} $0 onClickLogLink
	
	ClearErrors
	ExecWait '"$WINDIR\System32\bash.exe" -c "cd \"$LinuxInstallDir\" && xargs -a install.args ./install.sh | tee -a install-log.txt"' $1
	; IfErrors BashError NoBashError ; doesn't seem to work
	
	${FileReadFromEnd} "$INSTDIR\install-outcome.txt" "ReadOutcome"


	${If} $InstallSuccess == "false"
		${NSD_CreateLabel} 0 0 420 70 "Oh no! The installer reported an error and installation was unsuccessful! View the log for more insight of what went wrong."
		Pop $0
		SetCtlColors $0 "0xd12222" transparent
		GetDlgItem $0 $HWNDPARENT 1
		EnableWindow $0 0
	${Else}
		${NSD_CreateLabel} 0 0 420 70 "The installation script has been run, and the install log has been written to install-log.txt. If you installed the API, shortcut that launches both the manager and the API has been placed to your desktop. Enjoy!"	
		Pop $0
		${If} $DidInstallApi == "1"
			CreateShortCut "$DESKTOP\Astrometry-api-lite.lnk" "$WINDIR\System32\bash.exe" "-c $\"cd '$LinuxInstallDir' && bash -c ./kill-me.sh && node_modules/.bin/concurrently -p '[{name}]' -n 'Jobs,Api' -c 'yellow.bold,green.bold' 'node dist/manager/main.js' 'node dist/api/server.js'$\"" "$INSTDIR\icon.ico"
		${EndIf}
	
		${NSD_CreateLabel} 0 70 420 40 "You can read more about the application and the Dashboard from the readme (doc/readme.html). Please at least read the $\"Windows 10 primer$\"."
		Pop $0

		${NSD_CreateLink} 0 125 420 20 "Open readme in browser"
		Pop $0
		${NSD_OnClick} $0 onClickReadmeLink
	${EndIf}

	nsDialogs::Show

	${EnableX64FSRedirection}

FunctionEnd

Function onClickReadmeLink
	Pop $0
	;ExecShell "open" "$INSTDIR\doc\readme.html"
	${OpenURL} "$INSTDIR\doc\readme.html"
FunctionEnd


Function onClickLogLink
	Pop $0
	;ExecShell "open" "$INSTDIR\install-log.txt"
	${OpenURL} "$INSTDIR\install-log.txt"
FunctionEnd

Function .onInit
	InitPluginsDir
	ReserveFile "swagger.bmp"
	ReserveFile "dashboard.bmp"

	File /oname=$PLUGINSDIR\swagger.bmp "swagger.bmp"
	File /oname=$PLUGINSDIR\dashboard.bmp "dashboard.bmp"

	SectionSetSize ${SecANetPkg_1} 130
	SectionSetSize ${SecANetPkg_2} 161
	SectionSetSize ${SecANetPkg_3} 209
	SectionSetSize ${SecANetPkg_4} 332
	SectionSetSize ${SecANetPkg_5} 583
	SectionSetSize ${SecANetPkg_6} 1075
	SectionSetSize ${SecANetPkg_7} 2107
	SectionSetSize ${SecANetPkg_8} 4070
	SectionSetSize ${SecANetPkg_9} 7830
	SectionSetSize ${SecANetPkg_10} 20037
	SectionSetSize ${SecANetPkg_11} 40214
	SectionSetSize ${SecANetPkg_12} 79918
	SectionSetSize ${SecANetPkg_13} 165438
	SectionSetSize ${SecANetPkg_14} 328250
	SectionSetSize ${SecANetPkg_15} 659093
	SectionSetSize ${SecANetPkg_16} 1312986
	SectionSetSize ${SecANetPkg_17} 2627380
	SectionSetSize ${SecANetPkg_18} 5058875
	SectionSetSize ${SecANetPkg_19} 8822000
	SectionSetSize ${SecANetPkg_20} 13557000

	SectionSetSize ${SecApi} 130000

	SectionSetFlags ${SecInstall} 17

FunctionEnd

LangString DESC_SecANetPkg ${LANG_ENGLISH} "Installs the astrometry.net Debian/Ubuntu packages using apt-get in bash shell."
LangString DESC_SecIndexes ${LANG_ENGLISH} "Downloads astrometry.net index files (some indexes required for astrometry.net to run)."
LangString DESC_SecApi ${LANG_ENGLISH} "Downloads and installs the latest Astrometry-api-lite from Github."

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecANetPkg} $(DESC_SecANetPkg)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecIndexes} $(DESC_SecIndexes)
	!insertmacro MUI_DESCRIPTION_TEXT ${SecApi} $(DESC_SecApi)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
