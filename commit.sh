
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

git push origin master;
