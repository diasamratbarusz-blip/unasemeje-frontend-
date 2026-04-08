async function loadServices(){
  try {
    const res = await fetch(API_URL+"/services");
    const data = await res.json();

    allServices = data;

  } catch(err){
    console.error("Services load error:", err);
  }
}
