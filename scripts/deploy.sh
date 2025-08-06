#!/bin/bash
unset UNPROCESSED options optionsRequired

#Options that end with "=" require an argument
options=( "-h" "--help" "--quick" "--source=" )
echo "shit"

#Options that must be provided by the user, leave blank for no required options
optionsRequired=( ) 

#Set to true, if you want to allow this script to accept any option or argument.
#Set to false if you only want to allow options in  "options" and "optionsWithArgument"
ALLOW_UNPROCESSED="true" 

printHelp() {
    printf 'Usage: %s [OPTIONS]...\n' "$(basename "$0")"
    printf 'Usage: %s [OPTIONS]... (-source=<sourceValue>)\n' "$(basename "$0")"
    echo "  Deploys the application to a specified server."
    echo 
    echo "OPTIONS         Option description"
    echo "  --help        Prints this help page"
    echo "  --quick    Does not do a full build and deploys quickly."
    echo "  -source    What does source represent? "
    echo
    echo "ARGUMENTS     Option argument description"
    echo " sourceValue     Describe sourceValue in more detail!"
    echo
    exit 0
}

highlight=$(echo -en '\033[01;37m')
errorColor=$(echo -en '\033[01;31m')
warningColor=$(echo -en '\033[00;33m')
variableColor=$(echo -en '\033[7;90m')
norm=$(echo -en '\033[0m')

makeVariableName() {
    local tmp=$1
    local tmp="${tmp#"${tmp%%[!-]*}"}" # Remove all starting "-"
    tmp="${tmp//-/_}"
    tmp="${tmp%%=*}"                                # Remove last "="
    tmp=$(echo "$tmp" | tr '[:lower:]' '[:upper:]') # Replace "-" with "" and capitalize
    echo "$tmp"
}

#Function: parseOptions()
#
#Brief: Checks if all options are correct and saves each in a variable.
#After: Value of each options given, is stored in a uppercase named variable.
#       f. example -express will be stored in a global variable called EXPRESS
#Returns:
#      0 : (success) All parameters are valid
#      1 : (error) One or more parameters are invalid
#
declare -a UNPROCESSED=()
parseOptions() {
    containsElement() { #if function arrayContains exists, it can be used instead of containsElement
        local e match="$1"
        shift
        for e; do [[ "$e" == "$match" ]] && return 0; done
        return 1
    }

    extract_option() {
        local input=$1
        local regex='^[-]+[[:alpha:]][[:alnum:]_-]*=?'

        if [[ $input =~ $regex ]]; then
            local match=${BASH_REMATCH[0]}

            if [[ $match =~ = ]]; then
                echo "${match%%=*}="
            else
                echo "$match"
            fi
        else
            echo "$input"
        fi
    }

    extract_value() {
        local input_string="$1"
        local regex='^.*=(.*)$'
        if [[ $input_string =~ $regex ]]; then
            local value="${BASH_REMATCH[1]}"

            # Remove surrounding quotations if present
            if [[ $value =~ ^\'(.*)\'$ ]] || [[ $value =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            echo "$value"
        fi
    }

    declare -a _optionsFound _optionsValues
    declare tmp tmpValue tmpName
    declare option optionValue nextOption
    while (("$#")); do # While there are arguments still to be shifted
        tmp="$1"

        option=$(extract_option "$tmp")
        optionValue=$(extract_value "$tmp")

        if [[ -n "$option" && "$option" != ^-*= ]]; then
            #Option does not end with equal sign, so it could be a true or false option
            #or an option with argument that is given next in the argument list
            if containsElement "$option" "${options[@]}"; then
                #Option is a true or false option
                if [[ $option != *= ]]; then
                    optionValue="true"
                fi
                _optionsFound+=("$option")
                 [[ -z "$optionValue" ]] && echo "${errorColor}Argument missing for option ${norm} $option " && return 1
                _optionsValues+=("$optionValue")
            elif containsElement "${option}=" "${options[@]}"; then
                #option requires an argument, let's make sure that the argument is not an option to be sure user did not make a mistake
                nextOption=$(extract_option "$2")
                if [[ -n "$nextOption" ]]; then
                    #Argument is an option, so user could have made a mistake, let's check if we know this option
                    if containsElement "$nextOption" "${options[@]}" || containsElement "${nextOption}=" "${options[@]}"; then
                        #Given argument is a know option, user must have made a mistake
                        echo "${errorColor}Argument missing for option ${norm} $option "
                        return 1
                    else
                        # The argument is not an known option, so we will assume that the argument is a value
                        optionValue="$2"
                        [[ -z "$optionValue" ]] && echo "${errorColor}Argument missing for option ${norm} $option " && return 1
                    fi
                    #The argument is an known option that requires an argument, so we will append = to the option
                    _optionsFound+=("${option}=")
                    _optionsValues+=("$optionValue")
                else
                    # It an argument
                    optionValue="$2"
                    [[ -z "$optionValue" ]] && echo "${errorColor}Argument missing for option ${norm} $option " && return 1
                    _optionsFound+=("$option")
                    _optionsValues+=("$optionValue")
                fi
                shift
            else
                #Next option is not a known option, so if unprocessed options are allowed, we will assume that the argument is a value
                if [[ "$ALLOW_UNPROCESSED" == "true" ]]; then
                    UNPROCESSED+=("$1")
                else
                    # Unprocessed options are not allowed, so, we quit.
                    echo "${errorColor}Unknown option${norm} $option "
                    return 1
                fi
            fi
        else
            #if unprocessed options are allowed, we will assign this argument to the UNPROCESSED array
            if [[ "$ALLOW_UNPROCESSED" == "true" ]]; then
                UNPROCESSED+=("$1")
            else
                # Unprocessed options are not allowed, so, we quit.
                echo "${errorColor}Unknown option${norm} $1"
                return 1
            fi
        fi

        shift
    done

    # Declare variables global to the shell this script resides in

    for ((i = 0; i < ${#_optionsFound[@]}; i++)); do
        tmpName=$(makeVariableName "${_optionsFound[$i]}")
        tmpValue=${_optionsValues[$i]}
        printf -v "$tmpName" "$tmpValue" # Assign a value to VARIABLE

        if [[ -z "$tmpValue" ]]; then
            echo "Value missing for $tmpName"
            exit 1
        fi
    done

    if [[ -n "$HELP" || -n "$H" ]]; then printHelp; fi
    #Check if all required options have been provided.
    if [[ ${#optionsRequired[@]} -eq 0 ]]; then return 0; fi
    for arg in "${optionsRequired[@]}"; do
        if ! containsElement "$arg" "${_optionsFound[@]}"; then
            echo "${errorColor}Required option missing ${norm} $arg "
            return 1
        fi
    done
}

# You could test code below by running this script with these Arguments
#   ./thisScript.sh --quick -source="~/Downloads /home/gandalf" -weird
if ! parseOptions "$@"; then $(return >/dev/null 2>&1) && return 1 || exit 1; fi

#########################################################################
#   You can safely remove the code below, it is just for testing purposes
#########################################################################

# print ONE if empty
if [[ -z "$QUICK" ]]; then echo "Option --quick was NOT given"; fi
if [[ -n "$QUICK" ]]; then echo "Option --quick was given"    ; fi

echo -e "\nPrinting given options stored as environment variables\n"
printf "%-15s %-15s%-15s \n%-15s %-15s%-15s \n" "Option" "Variable name" "Value stored in variable" "------" "-------------" "------------------------"
for item in "${options[@]}"; do
    result=$(makeVariableName "$item")
    [[ -n "${!result}" ]] && printf '%-15s %-15s%-15s \n' "${item}" "${result}" "${variableColor}${!result}${norm}"
done

# Printing unprocessed arguments if any
for arg in "${UNPROCESSED[@]}"; do
    echo "${warningColor}Unprocessed argument${norm} $arg "
done

echo "${highlight}TODO: ${norm} Implement the main functionality of your script here."