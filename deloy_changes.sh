echo "Choose published version.\n1. Patch \n2. Minor\n3. Major\n4. Exit";
for (( ; ; ))
do
    read f;
    if [ \( "$f" == "1" \) -o \( "$f" == "2" \) -o \( "$f" == "3" \) ]
    then
        break;
    elif [ "$f" == "4" ]
        then
            exit;
    else
        echo "Invalid input.\nTry again.";
        #exit;
    fi
done
git add .;
for (( ; ; ))
do
    echo "Please enter commit message";
    read msg;
    if [ "$msg" == "" ]
        then
        echo "Comments are required.Please try again.";
    else
        break;
    fi
done
git commit -m "$msg";
if [ "$f" == "1" ]
    then
        npm version patch;
elif [ "$f" == "2" ]
    then
        npm version minor;
elif [ "$f" == "3" ]
    then
        npm version major;
fi
git push origin master;
